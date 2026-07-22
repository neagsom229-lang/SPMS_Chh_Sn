const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  family: 4,
  keepAlive: true,
});

// ✅ FIXED: Better query handling
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

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release();
  }
});

module.exports = db;