const odbc = require('odbc');
const fs = require('fs');

// Use absolute path
const dbPath = 'D:\\DSA_Y2_S2_for_Assighment_HW_and_Lesson\\spms-dashboard\\spms-dashboard\\database\\spms.accdb';
console.log('📁 Database path:', dbPath);

// Check if file exists
if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found!');
    process.exit(1);
}
console.log('✅ Database file found');

// Connection string - properly escaped
const connStr = "DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=" + dbPath + ";";

console.log('🔌 Testing ODBC connection...');
console.log('📝 Connection string:', connStr);

odbc.connect(connStr)
  .then(conn => {
    console.log('✅ Connected successfully!');
    return conn.query('SELECT 1 as test');
  })
  .then(result => {
    console.log('✅ Test query successful:', result);
    console.log('🎉 ODBC is working perfectly!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('💡 Make sure the database file is not corrupted');
    process.exit(1);
  });
