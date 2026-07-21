const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  get: (text, params) => pool.query(text, params).then(res => res.rows[0]),
  all: (text, params) => pool.query(text, params).then(res => res.rows),
  run: (text, params) => pool.query(text, params).then(res => ({ lastID: res.rows[0]?.id || 0, changes: res.rowCount })),
};