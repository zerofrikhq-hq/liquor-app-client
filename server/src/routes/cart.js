const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * Helper to fetch complete cart state for a user
 */
async function getFullCart(userId) {
  // Ensure cart exists
  await query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);

  const cartRes = await query(
    `SELECT c.id, c.user_id, c.vendor_id, v.business_name as vendor_name
     FROM carts c
     LEFT JOIN vendors v ON v.id = c.vendor_id
     WHERE c.user_id = $1`,
    [userId]
  );

  if (cartRes.rows.length === 0) {
    return {
      id: null,
      vendor: null,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      itemCount: 0,
    };
  }

  const cart = cartRes.rows[0];

  const itemsRes = await query(
    `SELECT 
       ci.id,
       ci.cart_id,
       ci.product_id,
       ci.quantity,
       ci.selected_volume,
       ci.unit_price,
       p.name as product_name,
       p.sku,
       p.base_image,
       p.qty as current_stock,
       p.is_in_stock
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cart.id]
  );

  let subtotal = 0;
  let itemCount = 0;

  const DEFAULT_BOTTLE = 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=300&q=80';

  const items = itemsRes.rows.map((row) => {
    const qty = parseInt(row.quantity, 10);
    const unitPrice = parseFloat(row.unit_price);
    const lineTotal = qty * unitPrice;
    subtotal += lineTotal;
    itemCount += qty;

    const safeImage = row.base_image && row.base_image.startsWith('http') && !row.base_image.includes('localhost')
      ? row.base_image
      : DEFAULT_BOTTLE;

    return {
      id: parseInt(row.id, 10),
      productId: row.product_id,
      name: row.product_name,
      sku: row.sku,
      imageUrl: safeImage,
      selectedVolume: row.selected_volume || '700mL',
      unitPrice,
      quantity: qty,
      lineTotal,
      currentStock: parseFloat(row.current_stock),
      isInStock: Boolean(row.is_in_stock && parseFloat(row.current_stock) >= qty),
    };
  });

  // Delivery fee: $9.99 or free if subtotal >= 100 (or if empty, 0)
  const deliveryFee = subtotal === 0 ? 0.0 : subtotal >= 100 ? 0.0 : 9.99;
  const total = subtotal + deliveryFee;

  return {
    id: parseInt(cart.id, 10),
    vendor: cart.vendor_id ? { id: parseInt(cart.vendor_id, 10), name: cart.vendor_name || 'Chillbro Vendor' } : null,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee,
    total: Math.round(total * 100) / 100,
    itemCount,
  };
}

/**
 * GET /api/cart?userId=:userId
 */
router.get('/', async (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId query parameter is required.' });
  }

  try {
    const cart = await getFullCart(userId);
    return res.json({ success: true, cart });
  } catch (error) {
    console.error('[CART] fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cart.', error: error.message });
  }
});

/**
 * POST /api/cart/items
 * Adds product to cart with Single-Vendor Conflict Protection
 * Body: { userId, vendorId, productId, quantity, selectedVolume, overwrite }
 */
router.post('/items', async (req, res) => {
  const { userId, vendorId, productId, quantity = 1, selectedVolume, overwrite = false } = req.body;

  if (!userId || !vendorId || !productId) {
    return res.status(400).json({
      success: false,
      message: 'userId, vendorId, and productId are required.',
    });
  }

  const uid = parseInt(userId, 10);
  const targetVendorId = parseInt(vendorId, 10);
  const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

  try {
    // 1. Ensure user's cart exists
    await query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [uid]);
    const cartRes = await query('SELECT id, vendor_id FROM carts WHERE user_id = $1', [uid]);
    const cart = cartRes.rows[0];

    // Check if cart has items
    const existingItemsCountRes = await query('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = $1', [cart.id]);
    const hasItems = parseInt(existingItemsCountRes.rows[0].count, 10) > 0;

    // 2. Single-Vendor Guard
    if (hasItems && cart.vendor_id && parseInt(cart.vendor_id, 10) !== targetVendorId) {
      if (!overwrite) {
        // Fetch current and target vendor names
        const vNamesRes = await query(
          'SELECT id, business_name FROM vendors WHERE id IN ($1, $2)',
          [cart.vendor_id, targetVendorId]
        );
        const currentVendorRow = vNamesRes.rows.find((r) => parseInt(r.id, 10) === parseInt(cart.vendor_id, 10));
        const newVendorRow = vNamesRes.rows.find((r) => parseInt(r.id, 10) === targetVendorId);

        return res.status(409).json({
          success: false,
          conflict: true,
          message: `You already have items from ${currentVendorRow?.business_name || 'another store'} in your cart.`,
          currentVendor: {
            id: parseInt(cart.vendor_id, 10),
            name: currentVendorRow?.business_name || 'Existing Store',
          },
          newVendor: {
            id: targetVendorId,
            name: newVendorRow?.business_name || 'New Store',
          },
        });
      }

      // Overwrite is true: clear existing items & switch vendor
      console.log(`[CART] Overwriting cart for user ${uid}: switching from vendor ${cart.vendor_id} to ${targetVendorId}`);
      await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
      await query('UPDATE carts SET vendor_id = $1, updated_at = NOW() WHERE id = $2', [targetVendorId, cart.id]);
    } else {
      // Set or update vendor_id on cart
      await query('UPDATE carts SET vendor_id = $1, updated_at = NOW() WHERE id = $2', [targetVendorId, cart.id]);
    }

    // 3. Fetch product details and price
    const prodRes = await query('SELECT id, price, special_price, size, qty, is_in_stock FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const prod = prodRes.rows[0];
    const unitPrice = prod.special_price ? parseFloat(prod.special_price) : parseFloat(prod.price);
    const volume = selectedVolume || prod.size || '700mL';
    const maxStock = Math.floor(parseFloat(prod.qty) || 0);

    // 4. Check if exact item already in cart
    const existingItemRes = await query(
      `SELECT id, quantity FROM cart_items 
       WHERE cart_id = $1 AND product_id = $2 AND COALESCE(selected_volume, '') = COALESCE($3, '')`,
      [cart.id, productId, volume]
    );

    const currentQtyInCart = existingItemRes.rows.length > 0 ? parseInt(existingItemRes.rows[0].quantity, 10) : 0;
    const finalQty = currentQtyInCart + qtyToAdd;

    if (finalQty > maxStock) {
      return res.status(400).json({
        success: false,
        message: maxStock <= 0
          ? `Sorry, "${prod.name || 'This item'}" is currently out of stock.`
          : `Cannot add more. You have ${currentQtyInCart} in your cart and only ${maxStock} bottle(s) exist in stock.`,
        currentStock: maxStock,
      });
    }

    if (existingItemRes.rows.length > 0) {
      await query(
        `UPDATE cart_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
        [qtyToAdd, existingItemRes.rows[0].id]
      );
    } else {
      await query(
        `INSERT INTO cart_items (cart_id, product_id, quantity, selected_volume, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [cart.id, productId, qtyToAdd, volume, unitPrice]
      );
    }

    // 5. Return refreshed cart
    const updatedCart = await getFullCart(uid);
    return res.status(200).json({
      success: true,
      message: 'Item added to cart!',
      cart: updatedCart,
    });
  } catch (error) {
    console.error('[CART] add item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart.', error: error.message });
  }
});

/**
 * PUT /api/cart/items/:itemId
 * Update quantity (qty <= 0 deletes item)
 */
router.put('/items/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const { userId, quantity } = req.body;

  if (!userId || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'userId and quantity are required.' });
  }

  const uid = parseInt(userId, 10);
  const newQty = parseInt(quantity, 10);

  try {
    if (newQty <= 0) {
      await query('DELETE FROM cart_items WHERE id = $1', [itemId]);
    } else {
      // Validate requested quantity against live inventory
      const itemStockRes = await query(
        `SELECT ci.id, ci.product_id, p.name, p.qty as stock, p.is_in_stock
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.id = $1`,
        [itemId]
      );

      if (itemStockRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Cart item not found.' });
      }

      const prod = itemStockRes.rows[0];
      const maxStock = Math.floor(parseFloat(prod.stock) || 0);

      if (newQty > maxStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${maxStock} bottle(s) of "${prod.name}" available in stock.`,
          currentStock: maxStock,
        });
      }

      await query('UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2', [newQty, itemId]);
    }

    // If cart is now empty, reset vendor_id
    const cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [uid]);
    if (cartRes.rows.length > 0) {
      const cartId = cartRes.rows[0].id;
      const countRes = await query('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = $1', [cartId]);
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        await query('UPDATE carts SET vendor_id = NULL WHERE id = $1', [cartId]);
      }
    }

    const updatedCart = await getFullCart(uid);
    return res.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('[CART] update quantity error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/cart/items/:itemId?userId=:userId
 */
router.delete('/items/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const userId = parseInt(req.query.userId, 10);

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required.' });
  }

  try {
    await query('DELETE FROM cart_items WHERE id = $1', [itemId]);

    const cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length > 0) {
      const cartId = cartRes.rows[0].id;
      const countRes = await query('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = $1', [cartId]);
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        await query('UPDATE carts SET vendor_id = NULL WHERE id = $1', [cartId]);
      }
    }

    const updatedCart = await getFullCart(userId);
    return res.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('[CART] delete item error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/cart?userId=:userId
 * Flushes user's entire cart
 */
router.delete('/', async (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required.' });
  }

  try {
    const cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length > 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1', [cartRes.rows[0].id]);
      await query('UPDATE carts SET vendor_id = NULL WHERE id = $1', [cartRes.rows[0].id]);
    }
    const updatedCart = await getFullCart(userId);
    return res.json({ success: true, message: 'Cart cleared.', cart: updatedCart });
  } catch (error) {
    console.error('[CART] clear error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
