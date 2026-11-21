const express = require('express');
const router = express.Router();
const { query } = require('../db');

// High-resolution fallback images for liquor categories & stores
const DEFAULT_STORE_IMAGES = {
  1: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', // Wine Cellar
  2: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80', // Whisky Lounge
  3: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80', // Craft Beer & Spirits
};

const DEFAULT_BOTTLE_IMAGES = [
  'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80', // Scotch
  'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=400&q=80', // Vodka/Gin
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80', // Bourbon / Whiskey
  'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80', // Cans / RTDs
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80', // Spirits
];

function getSafeProductImage(imgUrl, index = 0) {
  if (imgUrl && imgUrl.startsWith('http') && !imgUrl.includes('localhost') && !imgUrl.includes('Base Image')) {
    return imgUrl;
  }
  return DEFAULT_BOTTLE_IMAGES[index % DEFAULT_BOTTLE_IMAGES.length];
}

/**
 * GET /api/vendors
 * Lists active licensed liquor stores
 */
router.get('/', async (req, res) => {
  try {
    const vendorsRes = await query(`
      SELECT 
        v.id,
        v.public_id,
        v.business_name,
        v.business_description,
        v.created_at,
        va.address_line_1,
        va.city,
        va.postcode,
        va.state,
        vc.contact_person,
        vc.phone_number as contact_phone,
        vl.licence_number,
        COUNT(p.id) as product_count
      FROM vendors v
      LEFT JOIN vendor_addresses va ON va.vendor_id = v.id
      LEFT JOIN vendor_contacts vc ON vc.vendor_id = v.id
      LEFT JOIN vendor_licences vl ON vl.vendor_id = v.id
      LEFT JOIN products p ON p.vendor_id = v.id AND p.is_active = true
      GROUP BY v.id, v.public_id, v.business_name, v.business_description, v.created_at,
               va.address_line_1, va.city, va.postcode, va.state,
               vc.contact_person, vc.phone_number, vl.licence_number
      ORDER BY v.id ASC
    `);

    const distances = ['1.2 km away', '2.5 km away', '3.1 km away'];
    const ratings = [4.9, 4.8, 4.7];
    const reviewCounts = [142, 98, 76];

    const vendors = vendorsRes.rows.map((row, idx) => ({
      id: parseInt(row.id, 10),
      public_id: row.public_id,
      name: row.business_name,
      description: row.business_description || 'Licensed premium Australian retail cellar.',
      address: row.address_line1 ? `${row.address_line1}, ${row.city || 'Sydney'}` : 'Sydney, NSW',
      distance: distances[idx % distances.length],
      eta: '30–45 mins',
      rating: ratings[idx % ratings.length],
      reviewCount: reviewCounts[idx % reviewCounts.length],
      productCount: parseInt(row.product_count, 10),
      licenceNumber: row.licence_number || 'NSW-LIQ-77821',
      imageUrl: DEFAULT_STORE_IMAGES[row.id] || DEFAULT_STORE_IMAGES[1],
    }));

    return res.json({
      success: true,
      vendors,
    });
  } catch (error) {
    console.error('[VENDORS] fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors.',
      error: error.message,
    });
  }
});

/**
 * GET /api/vendors/categories
 * Returns all active product categories
 */
router.get('/categories', async (req, res) => {
  try {
    const catRes = await query(`
      SELECT id, name, url_key, description, image_url 
      FROM categories 
      WHERE is_active = true 
      ORDER BY position ASC, name ASC
    `);
    return res.json({
      success: true,
      categories: catRes.rows,
    });
  } catch (error) {
    console.error('[CATEGORIES] fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.',
      error: error.message,
    });
  }
});

/**
 * GET /api/vendors/search/global
 * Universal marketplace search across both products and vendors
 */
router.get('/search/global', async (req, res) => {
  const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
  if (!q) {
    return res.json({ success: true, products: [], vendors: [] });
  }

  try {
    const searchTerm = `%${q}%`;

    // 1. Search products across all active vendors
    const prodSql = `
      SELECT 
        p.id,
        p.vendor_id,
        v.business_name as vendor_name,
        p.sku,
        p.slug,
        p.name,
        p.brand_id,
        b.name as brand_name,
        c.name as category_name,
        p.subcategory,
        p.description,
        p.short_description,
        p.size,
        p.abv,
        p.origin,
        p.price,
        p.special_price,
        p.base_image,
        p.volume_options,
        p.rating,
        p.review_count,
        p.qty,
        p.is_in_stock
      FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.is_active = true 
        AND (
          LOWER(p.name) LIKE $1 
          OR LOWER(COALESCE(b.name, '')) LIKE $1 
          OR LOWER(COALESCE(c.name, '')) LIKE $1
          OR LOWER(COALESCE(p.subcategory, '')) LIKE $1
          OR LOWER(p.sku) LIKE $1
          OR LOWER(v.business_name) LIKE $1
        )
      GROUP BY p.id, v.business_name, b.name, c.name
      LIMIT 20
    `;

    const prodRes = await query(prodSql, [searchTerm]);

    // Deduplicate products by id
    const seen = new Set();
    const products = [];
    prodRes.rows.forEach((row, idx) => {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        products.push({
          id: row.id,
          vendorId: parseInt(row.vendor_id, 10),
          vendorName: row.vendor_name,
          sku: row.sku,
          slug: row.slug,
          name: row.name,
          brand: row.brand_name || 'Chillbro Select',
          categoryName: row.category_name || row.subcategory || 'Spirits',
          description: row.description || row.short_description || 'Premium selection, bottled with care.',
          size: row.size || '700mL',
          abv: row.abv ? (row.abv.includes('%') ? row.abv : `${row.abv}% ABV`) : '40% ABV',
          origin: row.origin || 'Australia',
          price: parseFloat(row.price),
          specialPrice: row.special_price ? parseFloat(row.special_price) : null,
          imageUrl: getSafeProductImage(row.base_image, idx),
          rating: parseFloat(row.rating || '4.8'),
          reviewCount: parseInt(row.review_count || '120', 10),
          qty: parseFloat(row.qty),
          isInStock: Boolean(row.is_in_stock && parseFloat(row.qty) > 0),
          volumeOptions: Array.isArray(row.volume_options) && row.volume_options.length > 0 
            ? row.volume_options 
            : [{ size: row.size || '700mL', price: parseFloat(row.price) }],
        });
      }
    });

    // 2. Search vendors
    const vendorSql = `
      SELECT v.id, v.public_id, v.business_name, v.business_description,
             va.address_line_1, va.city, va.postcode, va.state,
             vl.licence_number,
             COUNT(p.id) as product_count
      FROM vendors v
      LEFT JOIN vendor_addresses va ON va.vendor_id = v.id
      LEFT JOIN vendor_licences vl ON vl.vendor_id = v.id
      LEFT JOIN products p ON p.vendor_id = v.id AND p.is_active = true
      WHERE (LOWER(v.business_name) LIKE $1 OR LOWER(COALESCE(va.address_line_1, '')) LIKE $1)
      GROUP BY v.id, va.address_line_1, va.city, va.postcode, va.state, vl.licence_number
    `;
    const vendorRes = await query(vendorSql, [searchTerm]);
    const matchedVendors = vendorRes.rows.map((row) => ({
      id: parseInt(row.id, 10),
      publicId: row.public_id,
      name: row.business_name,
      description: row.business_description || 'Licensed premium Australian retail cellar.',
      address: row.address_line_1 ? `${row.address_line_1}, ${row.city || 'Sydney'}` : 'Sydney, NSW',
      eta: '30–45 mins',
      rating: 4.8,
      licenceNumber: row.licence_number || 'NSW-LIQ-77821',
      imageUrl: DEFAULT_STORE_IMAGES[row.id] || DEFAULT_STORE_IMAGES[1],
      productCount: parseInt(row.product_count, 10) || 0,
    }));

    return res.json({
      success: true,
      query: q,
      products,
      vendors: matchedVendors,
    });
  } catch (error) {
    console.error('[GLOBAL SEARCH] error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/vendors/:id
 * Single vendor details
 */
router.get('/:id', async (req, res) => {
  const vendorId = parseInt(req.params.id, 10);
  try {
    const vRes = await query(
      `SELECT v.id, v.public_id, v.business_name, v.business_description,
              va.address_line_1, va.city, va.postcode, va.state,
              vc.contact_person, vc.phone_number as contact_phone, vl.licence_number
       FROM vendors v
       LEFT JOIN vendor_addresses va ON va.vendor_id = v.id
       LEFT JOIN vendor_contacts vc ON vc.vendor_id = v.id
       LEFT JOIN vendor_licences vl ON vl.vendor_id = v.id
       WHERE v.id = $1`,
      [vendorId]
    );

    if (vRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const row = vRes.rows[0];
    const vendor = {
      id: parseInt(row.id, 10),
      public_id: row.public_id,
      name: row.business_name,
      description: row.business_description || 'Licensed premium Australian retail cellar.',
      address: row.address_line_1 ? `${row.address_line_1}, ${row.city || 'Sydney'}` : 'Sydney, NSW',
      eta: '30–45 mins',
      rating: 4.8,
      licenceNumber: row.licence_number || 'NSW-LIQ-77821',
      imageUrl: DEFAULT_STORE_IMAGES[row.id] || DEFAULT_STORE_IMAGES[1],
    };

    return res.json({ success: true, vendor });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/vendors/:id/products
 * Products belonging to vendor with smart filtering and sorting
 */
router.get('/:id/products', async (req, res) => {
  const vendorId = parseInt(req.params.id, 10);
  const { category, inStockOnly, search, sortBy } = req.query;

  try {
    let sql = `
      SELECT 
        p.id,
        p.vendor_id,
        p.sku,
        p.slug,
        p.name,
        p.brand_id,
        b.name as brand_name,
        c.name as category_name,
        p.subcategory,
        p.description,
        p.short_description,
        p.size,
        p.abv,
        p.origin,
        p.price,
        p.special_price,
        p.base_image,
        p.volume_options,
        p.rating,
        p.review_count,
        p.qty,
        p.is_in_stock,
        p.is_active
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.vendor_id = $1 AND p.is_active = true
    `;

    const params = [vendorId];

    if (inStockOnly === 'true') {
      sql += ` AND p.is_in_stock = true AND p.qty > 0`;
    }

    if (category && category.trim().length > 0 && category !== 'all') {
      params.push(category.trim().toLowerCase());
      sql += ` AND (LOWER(c.name) = $${params.length} OR LOWER(c.url_key) = $${params.length} OR LOWER(p.subcategory) = $${params.length})`;
    }

    if (search && search.trim().length > 0) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.sku) LIKE $${params.length})`;
    }

    sql += ` GROUP BY p.id, b.name, c.name`;

    // Sorting
    if (sortBy === 'price_asc') {
      sql += ` ORDER BY p.price ASC`;
    } else if (sortBy === 'price_desc') {
      sql += ` ORDER BY p.price DESC`;
    } else if (sortBy === 'rating') {
      sql += ` ORDER BY p.rating DESC NULLS LAST, p.review_count DESC`;
    } else {
      sql += ` ORDER BY p.created_at DESC`;
    }

    const prodRes = await query(sql, params);

    const products = prodRes.rows.map((row, idx) => ({
      id: row.id,
      vendorId: parseInt(row.vendor_id, 10),
      sku: row.sku,
      slug: row.slug,
      name: row.name,
      brand: row.brand_name || 'Chillbro Select',
      description: row.description || row.short_description || 'Premium selection, bottled with care.',
      size: row.size || '700mL',
      abv: row.abv ? (row.abv.includes('%') ? row.abv : `${row.abv}% ABV`) : '40% ABV',
      origin: row.origin || 'Australia',
      categoryName: row.category_name || row.subcategory || 'Spirits',
      price: parseFloat(row.price),
      specialPrice: row.special_price ? parseFloat(row.special_price) : null,
      imageUrl: getSafeProductImage(row.base_image, idx),
      rating: parseFloat(row.rating || '4.8'),
      reviewCount: parseInt(row.review_count || '120', 10),
      qty: parseFloat(row.qty),
      isInStock: Boolean(row.is_in_stock && parseFloat(row.qty) > 0),
      volumeOptions: Array.isArray(row.volume_options) && row.volume_options.length > 0 
        ? row.volume_options 
        : [{ size: row.size || '700mL', price: parseFloat(row.price) }],
    }));

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('[PRODUCTS] fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor products.',
      error: error.message,
    });
  }
});

/**
 * GET /api/products/:id
 * Full Product Details Page (PDP)
 */
router.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const prodRes = await query(
      `SELECT p.*, b.name as brand_name, v.business_name as vendor_name
       FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE p.id = $1`,
      [id]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const row = prodRes.rows[0];
    const product = {
      id: row.id,
      vendorId: parseInt(row.vendor_id, 10),
      vendorName: row.vendor_name || 'Chillbro Vendor',
      sku: row.sku,
      name: row.name,
      brand: row.brand_name || 'Chillbro Select',
      description: row.description || row.product_description || 'Crafted with premium ingredients.',
      size: row.size || '700mL',
      abv: row.abv ? (row.abv.includes('%') ? row.abv : `${row.abv}% ABV`) : '40% ABV',
      origin: row.origin || 'Australia',
      categoryName: row.category_name || row.subcategory || 'Spirits',
      price: parseFloat(row.price),
      specialPrice: row.special_price ? parseFloat(row.special_price) : null,
      imageUrl: getSafeProductImage(row.base_image, 0),
      rating: parseFloat(row.rating || '4.8'),
      reviewCount: parseInt(row.review_count || '120', 10),
      qty: parseFloat(row.qty),
      isInStock: Boolean(row.is_in_stock && parseFloat(row.qty) > 0),
      volumeOptions: Array.isArray(row.volume_options) && row.volume_options.length > 0 
        ? row.volume_options 
        : [{ size: row.size || '700mL', price: parseFloat(row.price) }],
      tastingNotes: row.tasting_notes || [],
    };

    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
