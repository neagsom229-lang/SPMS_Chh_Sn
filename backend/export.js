// backend/export.js
const fs = require('fs');
const path = require('path');
const dbModule = require('./config/database');

const tables = [
  'TBL_CUSTOMERS',
  'TBL_PRODUCTS',
  'TBL_ORDERS',
  'TBL_ORDERS_DETAILS',
  'TBL_PAYMENT',
  'TBL_SUPPLIERS',
  'Tbl_Stock',
  'Tbl_Users',
  'Tbl_Warranty'
];

async function exportTables() {
  console.log('📊 Exporting Access database...');
  
  for (const table of tables) {
    try {
      const rows = await new Promise((resolve, reject) => {
        dbModule.all(`SELECT * FROM ${table}`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      fs.writeFileSync(
        `${table}.json`,
        JSON.stringify(rows, null, 2)
      );
      console.log(`✅ Exported ${table}: ${rows.length} rows`);
    } catch (error) {
      console.error(`❌ Error exporting ${table}:`, error.message);
    }
  }
  
  console.log('🎉 Export complete!');
}

exportTables();