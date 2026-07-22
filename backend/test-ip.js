const { Pool } = require('pg');

// Use the IPv6 address we found earlier
const pool = new Pool({
  host: '2406:da1c:16f1:f601:dee:d67d:ff34:b5fe',
  port: 6543,
  database: 'postgres',
  user: 'postgres',
  password: 'samnang.com',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
  } else {
    console.log('✅ Connected! Time:', result.rows[0].now);
  }
  pool.end();
});