const { Pool } = require('pg');
const dns = require('dns');

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000,
  family: 4,
  keepAlive: true,
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

const db = {
  query: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      console.error('❌ Query error:', err.message);
      throw err;
    }
  },
  connect: async () => {
    try {
      return await pool.connect();
    } catch (err) {
      console.error('❌ Connection error:', err.message);
      return { release: () => {} };
    }
  },
  end: async () => {
    try { await pool.end(); } catch (e) {}
  }
};

module.exports = db;