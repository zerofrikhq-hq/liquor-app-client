const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { testDbConnection, query } = require('./db');

// Route modules
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint: API overview
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Chillbro On-Demand Liquor Delivery Backend API',
    endpoints: {
      health: '/api/health',
      dbStatus: '/api/db/status',
      auth: {
        register: 'POST /api/auth/register-request',
        verifyOtp: 'POST /api/auth/verify-registration-otp',
        login: 'POST /api/auth/login',
        forgotPassword: 'POST /api/auth/forgot-password-request',
        resetPassword: 'POST /api/auth/reset-password-verify',
      },
      vendors: {
        list: 'GET /api/vendors',
        single: 'GET /api/vendors/:id',
        products: 'GET /api/vendors/:id/products',
        categories: 'GET /api/vendors/categories',
      },
      cart: {
        get: 'GET /api/cart?userId=:userId',
        addItem: 'POST /api/cart/items',
        updateQty: 'PUT /api/cart/items/:id',
        deleteItem: 'DELETE /api/cart/items/:id?userId=:userId',
        clear: 'DELETE /api/cart?userId=:userId',
      },
      orders: {
        place: 'POST /api/orders/place',
        userOrders: 'GET /api/orders/user/:userId',
        single: 'GET /api/orders/:id',
      },
      profile: {
        get: 'GET /api/user/profile/:id',
        update: 'PUT /api/user/profile/:id',
      },
    },
    message: 'Chillbro backend is running and connected to PostgreSQL.',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// PostgreSQL connection status and diagnostics
app.get('/api/db/status', async (req, res) => {
  try {
    const status = await testDbConnection();
    res.json(status);
  } catch (err) {
    res.status(500).json({
      connected: false,
      message: 'Unexpected server error checking database status',
      error: err.message,
    });
  }
});

// Mount modular delivery platform routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user', profileRoutes);

// Legacy sample items endpoints (retained for backward compatibility)
app.get('/api/items', async (req, res) => {
  try {
    const dbStatus = await testDbConnection();
    if (!dbStatus.connected) {
      return res.status(503).json({ success: false, message: 'Database is not connected.', dbStatus });
    }
    const result = await query('SELECT id, title, description, created_at FROM sample_items ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, count: result.rowCount, items: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch items', error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  const { title, description } = req.body;
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Title is required.' });
  }
  try {
    const result = await query(
      'INSERT INTO sample_items (title, description) VALUES ($1, $2) RETURNING id, title, description, created_at',
      [title.trim(), (description || '').trim()]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start listening
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 Chillbro Delivery Server running on:`);
    console.log(`   - Local:    http://localhost:${PORT}`);
    console.log(`   - Network:  http://0.0.0.0:${PORT}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
