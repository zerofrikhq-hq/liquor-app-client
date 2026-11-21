const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../db');

/**
 * Helper to generate secure 6-digit numeric OTP code
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/register-request
 * Generates a 6-digit OTP and stores pending registration in `otps`
 */
router.post('/register-request', async (req, res) => {
  const { email, password, full_name, phone_number } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and full name are required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Check if user already exists
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // 2. Hash password & prepare payload
    const passwordHash = bcrypt.hashSync(password, 10);
    const otpCode = generateOtpCode();
    const payload = JSON.stringify({
      email: cleanEmail,
      password_hash: passwordHash,
      full_name: full_name.trim(),
      phone_number: (phone_number || '').trim(),
    });

    // 3. Invalidate any previous unexpired OTPs for this email and context
    await query(
      `UPDATE otps SET is_used = true 
       WHERE identifier = $1 AND form_context = 'customer_registration' AND is_used = false`,
      [cleanEmail]
    );

    // 4. Store in otps table (expires in 15 minutes)
    // Find next max id for otps
    const nextIdRes = await query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM otps');
    const nextId = nextIdRes.rows[0].next_id;

    await query(
      `INSERT INTO otps (id, identifier, form_context, otp_code, payload, attempts, expires_at, is_used)
       VALUES ($1, $2, 'customer_registration', $3, $4, 0, NOW() + INTERVAL '15 minutes', false)`,
      [nextId, cleanEmail, otpCode, payload]
    );

    console.log(`[AUTH] Registration OTP generated for ${cleanEmail}: ${otpCode}`);

    return res.json({
      success: true,
      message: 'Verification code generated. Please enter the 6-digit code to complete registration.',
      email: cleanEmail,
      devOtp: otpCode, // For testing & development convenience
    });
  } catch (error) {
    console.error('[AUTH] register-request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process registration request.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/verify-registration-otp
 * Verifies 6-digit OTP and creates customer in `users` with CUSTOMER role (id: 3)
 */
router.post('/verify-registration-otp', async (req, res) => {
  const { email, otp_code } = req.body;

  if (!email || !otp_code) {
    return res.status(400).json({
      success: false,
      message: 'Email and 6-digit OTP code are required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = otp_code.trim();

  try {
    // 1. Fetch latest active OTP
    const otpRes = await query(
      `SELECT * FROM otps 
       WHERE identifier = $1 AND form_context = 'customer_registration' AND is_used = false AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found or it has expired. Please request a new code.',
      });
    }

    const otpRow = otpRes.rows[0];

    // 2. Validate code
    if (otpRow.otp_code !== cleanCode) {
      await query('UPDATE otps SET attempts = attempts + 1 WHERE id = $1', [otpRow.id]);
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit verification code. Please check and try again.',
      });
    }

    // 3. Mark OTP as used
    await query('UPDATE otps SET is_used = true, updated_at = NOW() WHERE id = $1', [otpRow.id]);

    // 4. Create User
    const payload = typeof otpRow.payload === 'string' ? JSON.parse(otpRow.payload) : otpRow.payload;

    // Check if user already exists (edge case)
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    const nextUserIdRes = await query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM users');
    const nextUserId = nextUserIdRes.rows[0].next_id;

    const insertRes = await query(
      `INSERT INTO users (id, role_id, full_name, email, password_hash, phone_number, is_active)
       VALUES ($1, 3, $2, $3, $4, $5, true)
       RETURNING id, public_id, role_id, full_name, email, phone_number, created_at`,
      [nextUserId, payload.full_name, cleanEmail, payload.password_hash, payload.phone_number]
    );

    const user = insertRes.rows[0];
    user.role = 'CUSTOMER';

    // 5. Automatically create empty cart for the new user
    await query(
      `INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    console.log(`[AUTH] Customer created successfully: ID ${user.id} (${user.email})`);

    return res.status(201).json({
      success: true,
      message: 'Account verified and created successfully!',
      user,
    });
  } catch (error) {
    console.error('[AUTH] verify-registration-otp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code and create account.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials via bcrypt
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const userRes = await query(
      `SELECT u.id, u.public_id, u.role_id, u.full_name, u.email, u.password_hash, u.phone_number, u.is_active,
              r.code as role_code, r.name as role_name
       FROM users u
       LEFT JOIN user_roles r ON r.id = u.role_id
       WHERE LOWER(u.email) = $1`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Ensure cart exists
    await query('INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [user.id]);

    delete user.password_hash;
    user.role = user.role_code || 'CUSTOMER';

    return res.json({
      success: true,
      message: 'Welcome back to Chillbro!',
      user,
    });
  } catch (error) {
    console.error('[AUTH] login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/forgot-password-request
 * Generates OTP for password reset
 */
router.post('/forgot-password-request', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const userRes = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    const otpCode = generateOtpCode();

    await query(
      `UPDATE otps SET is_used = true 
       WHERE identifier = $1 AND form_context = 'password_reset' AND is_used = false`,
      [cleanEmail]
    );

    const nextIdRes = await query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM otps');
    const nextId = nextIdRes.rows[0].next_id;

    await query(
      `INSERT INTO otps (id, identifier, form_context, otp_code, payload, attempts, expires_at, is_used)
       VALUES ($1, $2, 'password_reset', $3, '{}'::jsonb, 0, NOW() + INTERVAL '15 minutes', false)`,
      [nextId, cleanEmail, otpCode]
    );

    console.log(`[AUTH] Password reset OTP generated for ${cleanEmail}: ${otpCode}`);

    return res.json({
      success: true,
      message: 'Password reset code generated. Please enter the 6-digit code.',
      email: cleanEmail,
      devOtp: otpCode,
    });
  } catch (error) {
    console.error('[AUTH] forgot-password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate password reset code.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/verify-reset-otp
 * Verifies password reset OTP before displaying new password fields
 */
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp_code } = req.body;

  if (!email || !otp_code) {
    return res.status(400).json({
      success: false,
      message: 'Email and verification code are required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = otp_code.trim();

  try {
    const otpRes = await query(
      `SELECT * FROM otps 
       WHERE identifier = $1 AND form_context = 'password_reset' AND is_used = false AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code.',
      });
    }

    const otpRow = otpRes.rows[0];

    if (otpRow.otp_code !== cleanCode) {
      await query('UPDATE otps SET attempts = attempts + 1 WHERE id = $1', [otpRow.id]);
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit code. Please check and try again.',
      });
    }

    return res.json({
      success: true,
      message: 'Verification code confirmed!',
    });
  } catch (error) {
    console.error('[AUTH] verify-reset-otp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify reset code.',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/reset-password-verify
 * Verifies OTP and updates user's password
 */
router.post('/reset-password-verify', async (req, res) => {
  const { email, otp_code, new_password } = req.body;

  if (!email || !otp_code || !new_password) {
    return res.status(400).json({
      success: false,
      message: 'Email, verification code, and new password are required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = otp_code.trim();

  try {
    const otpRes = await query(
      `SELECT * FROM otps 
       WHERE identifier = $1 AND form_context = 'password_reset' AND is_used = false AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code.',
      });
    }

    const otpRow = otpRes.rows[0];

    if (otpRow.otp_code !== cleanCode) {
      await query('UPDATE otps SET attempts = attempts + 1 WHERE id = $1', [otpRow.id]);
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit code.',
      });
    }

    // Mark used
    await query('UPDATE otps SET is_used = true, updated_at = NOW() WHERE id = $1', [otpRow.id]);

    // Update password
    const newHash = bcrypt.hashSync(new_password, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2', [
      newHash,
      cleanEmail,
    ]);

    return res.json({
      success: true,
      message: 'Password updated successfully! Please log in with your new password.',
    });
  } catch (error) {
    console.error('[AUTH] reset-password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
      error: error.message,
    });
  }
});

module.exports = router;
