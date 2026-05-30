const { Pool } = require('pg');
require('dotenv').config();
const { simulateQuery } = require('./mockDb');

let pool = null;
let useMock = false;

// 1. Initialize PostgreSQL Connection Pool
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://db_user:db_password@localhost:5432/campusos_db',
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 1000 // Fast timeout for quick local fallback
  });

  // Test the database connection pool immediately on initialization
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.warn(`====================================================`);
      console.warn(`⚠️  PostgreSQL Database unreachable. Fallback Enabled.`);
      console.warn(`🌍 Running PVPPCOE High-Fidelity Mock In-Memory DB.`);
      console.warn(`====================================================`);
      useMock = true;
    } else {
      console.log(`====================================================`);
      console.log(`📡 Connected successfully to local PostgreSQL!`);
      console.log(`====================================================`);
    }
  });
} catch (error) {
  console.warn("⚠️ Pool initialization failed, defaulting to in-memory mock.");
  useMock = true;
}

/**
 * Execute a DB query with RLS (Row-Level Security) isolation.
 * Automatically switches to in-memory mock engine if PostgreSQL is offline.
 * 
 * @param {string} tenantId - The active UUID tenant ID from request context.
 * @param {string} text - Parameterized SQL query string.
 * @param {Array} params - Array of parameters matching SQL variables.
 * @returns {Promise<Object>} - Standard PostgreSQL result payload.
 */
const executeTenantQuery = async (tenantId, text, params = []) => {
  if (useMock) {
    // Gracefully dispatch queries to local high-fidelity memory simulator
    return simulateQuery(tenantId, text, params);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Set tenant context inside active connection transaction variables
    await client.query(
      `SET LOCAL app.current_tenant = $1`, 
      [tenantId]
    );
    
    const result = await client.query(text, params);
    
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  executeTenantQuery,
  isMockActive: () => useMock
};
