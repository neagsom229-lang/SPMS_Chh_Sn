const dbModule = require('./backend/config/database');

console.log('🔍 Checking database contents...\n');

dbModule.initDatabase().then(() => {
  // Check customers
  dbModule.all("SELECT CUS_ID, FIRST_NAME, LAST_NAME, PHONE, E_MAIL FROM TBL_CUSTOMERS", [], (err, rows) => {
    if (!err && rows) {
      console.log('👥 Customers:');
      rows.slice(0, 5).forEach(c => {
        console.log(  :   - );
      });
      if (rows.length > 5) console.log(  ... and  more);
      console.log(  Total: \n);
    }
  });
  
  // Check users (without passwords)
  setTimeout(() => {
    dbModule.all("SELECT UserID, Username, Role FROM Tbl_Users", [], (err, rows) => {
      if (!err && rows) {
        console.log('👤 Users:');
        rows.forEach(u => {
          console.log(  :  ());
        });
        console.log(  Total: \n);
      }
    });
  }, 100);
  
  // Check products
  setTimeout(() => {
    dbModule.all("SELECT PRODUCT_ID, NAME_EN, SALEOUT_PRICE FROM TBL_PRODUCTS", [], (err, rows) => {
      if (!err && rows) {
        console.log('📦 Products:');
        rows.slice(0, 5).forEach(p => {
          console.log(  :  - Modified: $(Get-Item $dbPath).LastWriteTime{p.SALEOUT_PRICE});
        });
        if (rows.length > 5) console.log(  ... and  more);
        console.log(  Total: \n);
      }
    });
  }, 200);
  
  // Check orders
  setTimeout(() => {
    dbModule.all("SELECT ORDER_NO, AMOUNT_US, STATUS FROM TBL_ORDERS", [], (err, rows) => {
      if (!err && rows) {
        console.log('📋 Orders:');
        rows.slice(0, 5).forEach(o => {
          console.log(  : Modified: $(Get-Item $dbPath).LastWriteTime{o.AMOUNT_US} ());
        });
        if (rows.length > 5) console.log(  ... and  more);
        console.log(  Total: \n);
      }
    });
  }, 300);
  
  // Check suppliers
  setTimeout(() => {
    dbModule.all("SELECT SUP_ID, COMPANY, PHONE FROM TBL_SUPPLIERS", [], (err, rows) => {
      if (!err && rows) {
        console.log('🚚 Suppliers:');
        rows.slice(0, 5).forEach(s => {
          console.log(  :  - );
        });
        if (rows.length > 5) console.log(  ... and  more);
        console.log(  Total: \n);
      }
    });
  }, 400);
});
