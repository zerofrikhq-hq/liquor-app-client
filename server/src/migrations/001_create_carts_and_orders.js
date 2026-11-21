const { query, getPool } = require('../db');

async function runMigration() {
  console.log('🚀 Running database migration for Carts, Orders, and Roles...');

  // 1. Role: CUSTOMER
  await query(`
    INSERT INTO user_roles (id, code, name, description, is_active)
    VALUES (3, 'CUSTOMER', 'Customer', 'End-user mobile delivery customer', true)
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      name = EXCLUDED.name,
      description = EXCLUDED.description;
  `);
  console.log('✅ CUSTOMER role verified in user_roles');

  // 2. Carts
  await query(`
    CREATE TABLE IF NOT EXISTS carts (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      vendor_id BIGINT REFERENCES vendors(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ carts table created/verified');

  // 3. Cart Items
  await query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id BIGSERIAL PRIMARY KEY,
      cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      selected_volume VARCHAR(100),
      unit_price NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_cart_product_variant UNIQUE (cart_id, product_id, selected_volume)
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);`);
  console.log('✅ cart_items table created/verified');

  // 4. Orders
  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      public_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
      status VARCHAR(50) DEFAULT 'placed' NOT NULL,
      subtotal NUMERIC(10,2) NOT NULL,
      delivery_fee NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
      tax_amount NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
      total_amount NUMERIC(10,2) NOT NULL,
      delivery_address TEXT NOT NULL,
      contact_phone VARCHAR(50) NOT NULL,
      delivery_instructions TEXT,
      payment_status VARCHAR(50) DEFAULT 'paid' NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'stripe' NOT NULL,
      stripe_payment_intent_id VARCHAR(255),
      estimated_delivery_time TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);`);
  console.log('✅ orders table created/verified');

  // 5. Order Items
  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(10,2) NOT NULL,
      subtotal NUMERIC(10,2) NOT NULL,
      selected_volume VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`);
  console.log('✅ order_items table created/verified');

  console.log('🎉 All migrations applied successfully!');
}

runMigration()
  .then(() => getPool().end())
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
