const { query } = require('../src/db');

async function runMigration() {
  console.log('Running migration: create user_addresses table...');
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(50) DEFAULT 'Home',
        address_line_1 TEXT NOT NULL,
        unit_number VARCHAR(50),
        city VARCHAR(100) DEFAULT 'Sydney',
        state VARCHAR(50) DEFAULT 'NSW',
        postcode VARCHAR(20),
        delivery_instructions TEXT,
        contact_phone VARCHAR(50),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
    `);
    console.log('✅ Table user_addresses created successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().then(() => process.exit(0));
