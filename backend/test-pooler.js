const { Pool } = require('pg');

// Use the Transaction Pooler connection string
const pool = new Pool({
  connectionString: 'postgresql://postgres:samnang.com@db.eknnkeywalbqydmepybe.supabase.co:6543/postgres',
  ssl: { rejectUnauthorized: false },
  family: 4,
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