const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/user/profile/:id
 */
router.get('/profile/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const userRes = await query(
      `SELECT id, public_id, role_id, full_name, email, phone_number, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, profile: userRes.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/user/profile/:id
 */
router.put('/profile/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { full_name, phone_number } = req.body;

  if (!full_name) {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }

  try {
    const updateRes = await query(
      `UPDATE users 
       SET full_name = $1, phone_number = $2, updated_at = NOW() 
       WHERE id = $3
       RETURNING id, public_id, full_name, email, phone_number`,
      [full_name.trim(), (phone_number || '').trim(), userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      profile: updateRes.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper to map DB row to client UserAddress
 */
function mapAddressRow(row) {
  return {
    id: parseInt(row.id, 10),
    userId: parseInt(row.user_id, 10),
    label: row.label || 'Home',
    addressLine1: row.address_line_1,
    unitNumber: row.unit_number || '',
    city: row.city || 'Sydney',
    state: row.state || 'NSW',
    postcode: row.postcode || '',
    deliveryInstructions: row.delivery_instructions || '',
    contactPhone: row.contact_phone || '',
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

/**
 * GET /api/user/:userId/addresses
 * List all saved delivery addresses for a customer
 */
router.get('/:userId/addresses', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Valid userId parameter is required.' });
  }

  try {
    const result = await query(
      `SELECT * FROM user_addresses 
       WHERE user_id = $1 
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      addresses: result.rows.map(mapAddressRow),
    });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/user/:userId/addresses
 * Save a new delivery address
 */
router.post('/:userId/addresses', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Valid userId parameter is required.' });
  }

  const {
    label = 'Home',
    addressLine1,
    address_line_1,
    unitNumber,
    unit_number,
    city = 'Sydney',
    state = 'NSW',
    postcode = '',
    deliveryInstructions,
    delivery_instructions,
    contactPhone,
    contact_phone,
    isDefault = false,
    is_default = false,
  } = req.body;

  const resolvedAddress = (addressLine1 || address_line_1 || '').trim();
  if (!resolvedAddress) {
    return res.status(400).json({ success: false, message: 'Address is required.' });
  }

  const resolvedUnit = (unitNumber || unit_number || '').trim();
  const resolvedInstructions = (deliveryInstructions || delivery_instructions || '').trim();
  const resolvedPhone = (contactPhone || contact_phone || '').trim();
  const resolvedIsDefault = Boolean(isDefault || is_default);

  try {
    // If setting as default, unset any previous defaults for this user
    if (resolvedIsDefault) {
      await query(`UPDATE user_addresses SET is_default = false WHERE user_id = $1`, [userId]);
    }

    // Check if this exact address already exists for user to avoid duplicates
    const existing = await query(
      `SELECT id FROM user_addresses WHERE user_id = $1 AND LOWER(TRIM(address_line_1)) = LOWER($2)`,
      [userId, resolvedAddress]
    );

    let savedRow;
    if (existing.rows.length > 0) {
      // Update existing address
      const updateRes = await query(
        `UPDATE user_addresses
         SET label = $1, unit_number = $2, city = $3, state = $4, postcode = $5,
             delivery_instructions = $6, contact_phone = $7, is_default = $8, updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          label.trim() || 'Home',
          resolvedUnit,
          city.trim() || 'Sydney',
          state.trim() || 'NSW',
          postcode.trim(),
          resolvedInstructions,
          resolvedPhone,
          resolvedIsDefault,
          existing.rows[0].id,
        ]
      );
      savedRow = updateRes.rows[0];
    } else {
      // Insert new address
      const insertRes = await query(
        `INSERT INTO user_addresses (
           user_id, label, address_line_1, unit_number, city, state, postcode,
           delivery_instructions, contact_phone, is_default
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          label.trim() || 'Home',
          resolvedAddress,
          resolvedUnit,
          city.trim() || 'Sydney',
          state.trim() || 'NSW',
          postcode.trim(),
          resolvedInstructions,
          resolvedPhone,
          resolvedIsDefault,
        ]
      );
      savedRow = insertRes.rows[0];
    }

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully!',
      address: mapAddressRow(savedRow),
    });
  } catch (error) {
    console.error('Error saving user address:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/user/:userId/addresses/:addressId
 * Delete a saved address
 */
router.delete('/:userId/addresses/:addressId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const addressId = parseInt(req.params.addressId, 10);

  if (!userId || !addressId) {
    return res.status(400).json({ success: false, message: 'userId and addressId are required.' });
  }

  try {
    const result = await query(
      `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id`,
      [addressId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    return res.json({ success: true, message: 'Address removed successfully.' });
  } catch (error) {
    console.error('Error deleting user address:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
