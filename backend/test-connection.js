const { Pool } = require('pg');

// Try different connection strings
const testStrings = [
  'postgresql://postgres:samnang.com@db.eknnkeywalbqydmepybe.supabase.co:5432/postgres?family=4',
  'postgresql://postgres:samnang.com@[2406:da1c:16f1:f601:dee:d67d:ff34:b5fe]:5432/postgres',
  'postgresql://postgres:samnang.com@db.eknnkeywalbqydmepybe.supabase.co:6543/postgres?sslmode=require',
];

async function testConnection() {
  for (const connStr of testStrings) {
    console.log(`\n🔍 Testing: ${connStr.substring(0, 60)}...`);
    try {
      const pool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      const result = await pool.query('SELECT NOW()');
      console.log('✅ SUCCESS! Time:', result.rows[0].now);
      pool.end();
      return;
    } catch (err) {
      console.log('❌ Failed:', err.message);
    }
  }
  console.log('\n❌ All connection attempts failed');
}

testConnection();