const express = require('express');
const router = express.Router();
const { getPool, query } = require('../db');

/**
 * POST /api/orders/place
 * Places order atomically, decrements inventory, and empties cart
 */
router.post('/place', async (req, res) => {
  const {
    userId,
    deliveryAddress,
    contactPhone,
    deliveryInstructions,
    paymentMethod = 'stripe',
    stripePaymentIntentId,
  } = req.body;

  if (!userId || !deliveryAddress || !contactPhone) {
    return res.status(400).json({
      success: false,
      message: 'userId, deliveryAddress, and contactPhone are required.',
    });
  }

  const uid = parseInt(userId, 10);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch user's cart
    const cartRes = await client.query('SELECT id, vendor_id FROM carts WHERE user_id = $1 FOR UPDATE', [uid]);
    if (cartRes.rows.length === 0 || !cartRes.rows[0].vendor_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const cart = cartRes.rows[0];

    // 2. Fetch cart items
    const itemsRes = await client.query(
      `SELECT ci.*, p.name as product_name, p.sku, p.price, p.special_price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cart.id]
    );

    if (itemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const cartItems = itemsRes.rows;
    const productIds = cartItems.map((item) => item.product_id);

    // 3. Lock products and verify live inventory
    const lockProdRes = await client.query(
      `SELECT id, name, qty, is_in_stock FROM products WHERE id = ANY($1) FOR UPDATE`,
      [productIds]
    );

    const stockMap = {};
    lockProdRes.rows.forEach((p) => {
      stockMap[p.id] = p;
    });

    let subtotal = 0;
    for (const item of cartItems) {
      const liveProd = stockMap[item.product_id];
      if (!liveProd) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Product ${item.product_name} is no longer available.` });
      }

      const availableQty = parseFloat(liveProd.qty);
      if (availableQty < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${liveProd.name}". Only ${availableQty} left.`,
        });
      }

      subtotal += item.quantity * parseFloat(item.unit_price);
    }

    const deliveryFee = subtotal >= 100 ? 0.0 : 9.99;
    const totalAmount = subtotal + deliveryFee;

    // 4. Create Order row
    const orderInsertRes = await client.query(
      `INSERT INTO orders (
         user_id, vendor_id, status, subtotal, delivery_fee, total_amount,
         delivery_address, contact_phone, delivery_instructions,
         payment_status, payment_method, stripe_payment_intent_id,
         estimated_delivery_time
       ) VALUES ($1, $2, 'placed', $3, $4, $5, $6, $7, $8, 'paid', $9, $10, NOW() + INTERVAL '35 minutes')
       RETURNING *`,
      [
        uid,
        cart.vendor_id,
        subtotal,
        deliveryFee,
        totalAmount,
        deliveryAddress.trim(),
        contactPhone.trim(),
        (deliveryInstructions || '').trim(),
        paymentMethod,
        stripePaymentIntentId || `pi_sim_${Date.now()}`,
      ]
    );

    const order = orderInsertRes.rows[0];

    // 5. Insert Order Items & Decrement Inventory Atomically
    for (const item of cartItems) {
      const lineSubtotal = item.quantity * parseFloat(item.unit_price);

      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, sku, quantity, unit_price, subtotal, selected_volume)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          order.id,
          item.product_id,
          item.product_name,
          item.sku,
          item.quantity,
          item.unit_price,
          lineSubtotal,
          item.selected_volume,
        ]
      );

      // Decrement inventory stock
      await client.query(
        `UPDATE products 
         SET qty = qty - $1, 
             is_in_stock = (qty - $1 > 0),
             sold_count_month = sold_count_month + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Flush user's cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
    await client.query('UPDATE carts SET vendor_id = NULL, updated_at = NOW() WHERE id = $1', [cart.id]);

    await client.query('COMMIT');
    console.log(`[ORDER] Order #${order.id} placed successfully for User ${uid}. Total: $${totalAmount}`);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: parseInt(order.id, 10),
        publicId: order.public_id,
        status: order.status,
        subtotal: parseFloat(order.subtotal),
        deliveryFee: parseFloat(order.delivery_fee),
        totalAmount: parseFloat(order.total_amount),
        deliveryAddress: order.delivery_address,
        estimatedDeliveryTime: order.estimated_delivery_time,
        createdAt: order.created_at,
        itemCount: cartItems.length,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[ORDER] place error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place order.', error: error.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/orders/user/:userId
 * List customer's orders
 */
router.get('/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const ordersRes = await query(
      `SELECT o.*, v.business_name as vendor_name
       FROM orders o
       LEFT JOIN vendors v ON v.id = o.vendor_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const orders = [];
    for (const row of ordersRes.rows) {
      const itemsRes = await query(
        `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
        [row.id]
      );

      orders.push({
        id: parseInt(row.id, 10),
        publicId: row.public_id,
        vendorName: row.vendor_name || 'Chillbro Vendor',
        status: row.status,
        subtotal: parseFloat(row.subtotal),
        deliveryFee: parseFloat(row.delivery_fee),
        totalAmount: parseFloat(row.total_amount),
        deliveryAddress: row.delivery_address,
        estimatedDeliveryTime: row.estimated_delivery_time,
        createdAt: row.created_at,
        items: itemsRes.rows.map((item) => ({
          id: parseInt(item.id, 10),
          productName: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          subtotal: parseFloat(item.subtotal),
          selectedVolume: item.selected_volume,
        })),
      });
    }

    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[ORDERS] fetch user orders error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  try {
    const orderRes = await query(
      `SELECT o.*, v.business_name as vendor_name
       FROM orders o
       LEFT JOIN vendors v ON v.id = o.vendor_id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const row = orderRes.rows[0];
    const itemsRes = await query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);

    const order = {
      id: parseInt(row.id, 10),
      publicId: row.public_id,
      vendorName: row.vendor_name || 'Chillbro Store',
      status: row.status,
      subtotal: parseFloat(row.subtotal),
      deliveryFee: parseFloat(row.delivery_fee),
      totalAmount: parseFloat(row.total_amount),
      deliveryAddress: row.delivery_address,
      contactPhone: row.contact_phone,
      deliveryInstructions: row.delivery_instructions,
      estimatedDeliveryTime: row.estimated_delivery_time,
      createdAt: row.created_at,
      items: itemsRes.rows.map((i) => ({
        id: parseInt(i.id, 10),
        productName: i.product_name,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: parseFloat(i.unit_price),
        subtotal: parseFloat(i.subtotal),
        selectedVolume: i.selected_volume,
      })),
    };

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
