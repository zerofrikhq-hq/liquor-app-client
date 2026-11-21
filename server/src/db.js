const path = require('path');
const { Pool } = require('pg');
const { parse: parseConnectionString } = require('pg-connection-string');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let pool = null;

/**
 * Initializes and returns the PostgreSQL Pool instance.
 */
function getPool() {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const isSsl =
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === 'require' ||
    Boolean(databaseUrl && (databaseUrl.includes('sslmode=') || databaseUrl.includes('ondigitalocean.com')));

  if (databaseUrl && databaseUrl.trim().length > 0) {
    let poolConfig = {
      connectionString: databaseUrl,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    if (isSsl) {
      try {
        const parsed = parseConnectionString(databaseUrl);
        poolConfig = {
          ...parsed,
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        };
      } catch (err) {
        // Fallback: strip or replace strict sslmode if parse fails
        poolConfig.connectionString = databaseUrl.replace(/sslmode=require/g, 'sslmode=no-verify');
        poolConfig.ssl = { rejectUnauthorized: false };
      }
    }

    pool = new Pool(poolConfig);
  } else {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'mobile_app_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });

  return pool;
}

/**
 * Tests the PostgreSQL connection and gathers diagnostic metadata.
 */
async function testDbConnection() {
  // Check if credentials appear unconfigured
  const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
  const hasPassword = Boolean(process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim().length > 0);

  if (!hasDbUrl && !hasPassword) {
    return {
      connected: false,
      isConfigured: false,
      message: 'PostgreSQL credentials not provided yet. Please set DB_PASSWORD or DATABASE_URL in server/.env',
      details: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'mobile_app_db',
        user: process.env.DB_USER || 'postgres',
      },
    };
  }

  const startTime = Date.now();
  let client;

  try {
    const activePool = getPool();
    client = await activePool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version, current_database() as database_name');
    const latencyMs = Date.now() - startTime;

    // Ensure sample table exists for the mobile app
    await client.query(`
      CREATE TABLE IF NOT EXISTS sample_items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return {
      connected: true,
      isConfigured: true,
      message: 'Successfully connected to PostgreSQL database!',
      latencyMs,
      timestamp: result.rows[0].current_time,
      database: result.rows[0].database_name,
      postgresVersion: result.rows[0].pg_version.split(',')[0],
    };
  } catch (error) {
    return {
      connected: false,
      isConfigured: true,
      message: 'Failed to connect to PostgreSQL.',
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      details: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'mobile_app_db',
        user: process.env.DB_USER || 'postgres',
      },
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Execute a parameterized SQL query.
 */
async function query(text, params) {
  const activePool = getPool();
  return activePool.query(text, params);
}

module.exports = {
  getPool,
  testDbConnection,
  query,
};
