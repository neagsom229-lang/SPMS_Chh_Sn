// ============================================
// ODBC - Conditional Load for Windows/Linux
// ============================================
let odbc;

// Only try to load odbc on Windows
const isWindows = process.platform === 'win32';
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

if (isWindows && !isVercel) {
  try {
    odbc = require('odbc');
    console.log('✅ ODBC loaded successfully');
  } catch (err) {
    console.warn('⚠️ ODBC not available:', err.message);
    odbc = null;
  }
} else if (isVercel) {
  console.log('ℹ️ Running on Vercel - ODBC disabled');
  odbc = null;
} else {
  console.log('ℹ️ Running on non-Windows platform - ODBC disabled');
  odbc = null;
}

const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/spms.accdb');
let connection = null;
let isConnected = false;
let isInitialized = false;

// ============================================
// MOCK DATA FOR DEMO MODE
// ============================================
const mockData = {
  customers: [
    { CUS_ID: 'CUS001', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', E_MAIL: 'john@example.com', ADDRESS: '123 Main St', STATUS: 'Active', BALANCE: 150.00 },
    { CUS_ID: 'CUS002', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', E_MAIL: 'jane@example.com', ADDRESS: '456 Oak Ave', STATUS: 'Active', BALANCE: 0.00 },
    { CUS_ID: 'CUS003', FIRST_NAME: 'Robert', LAST_NAME: 'Johnson', PHONE: '555-0103', E_MAIL: 'robert@example.com', ADDRESS: '789 Pine Rd', STATUS: 'Active', BALANCE: 75.50 },
    { CUS_ID: 'CUS004', FIRST_NAME: 'Mary', LAST_NAME: 'Williams', PHONE: '555-0104', E_MAIL: 'mary@example.com', ADDRESS: '321 Elm St', STATUS: 'Inactive', BALANCE: 200.00 },
    { CUS_ID: 'CUS005', FIRST_NAME: 'David', LAST_NAME: 'Brown', PHONE: '555-0105', E_MAIL: 'david@example.com', ADDRESS: '654 Maple Dr', STATUS: 'Active', BALANCE: 0.00 },
  ],
  products: [
    { ID: 1, PRODUCT_ID: 'PROD001', NAME_EN: 'Laptop Pro', NAME_KH: 'កុំព្យូទ័រយួរដៃ Pro', SALEOUT_PRICE: 1299.99, QtyInStock: 15, STATUS: 'Active', CATEGORY: 'Electronics' },
    { ID: 2, PRODUCT_ID: 'PROD002', NAME_EN: 'Smartphone X', NAME_KH: 'ទូរស័ព្ទ X', SALEOUT_PRICE: 899.99, QtyInStock: 25, STATUS: 'Active', CATEGORY: 'Electronics' },
    { ID: 3, PRODUCT_ID: 'PROD003', NAME_EN: 'Tablet Plus', NAME_KH: 'ថេប្លេត Plus', SALEOUT_PRICE: 499.99, QtyInStock: 10, STATUS: 'Active', CATEGORY: 'Electronics' },
    { ID: 4, PRODUCT_ID: 'PROD004', NAME_EN: 'Wireless Mouse', NAME_KH: 'កណ្ដុរឥតខ្សែ', SALEOUT_PRICE: 29.99, QtyInStock: 50, STATUS: 'Active', CATEGORY: 'Accessories' },
    { ID: 5, PRODUCT_ID: 'PROD005', NAME_EN: 'Keyboard Pro', NAME_KH: 'ក្ដារចុច Pro', SALEOUT_PRICE: 79.99, QtyInStock: 30, STATUS: 'Active', CATEGORY: 'Accessories' },
  ],
  stock: [
    { StockID: 1, ProductID: 1, QtyInStock: 15, QtyAvailable: 12, QtyReserved: 3 },
    { StockID: 2, ProductID: 2, QtyInStock: 25, QtyAvailable: 20, QtyReserved: 5 },
    { StockID: 3, ProductID: 3, QtyInStock: 5, QtyAvailable: 3, QtyReserved: 2 },
    { StockID: 4, ProductID: 4, QtyInStock: 50, QtyAvailable: 48, QtyReserved: 2 },
    { StockID: 5, ProductID: 5, QtyInStock: 30, QtyAvailable: 28, QtyReserved: 2 },
  ],
  orders: [
    { OR_ID: 1, ORDER_NO: 'ORD-001', ORDER_DATE: '2024-01-15', AMOUNT_US: 149.99, STATUS: 'Completed', CUSTOMER_ID: 'CUS001' },
    { OR_ID: 2, ORDER_NO: 'ORD-002', ORDER_DATE: '2024-01-20', AMOUNT_US: 89.50, STATUS: 'Pending', CUSTOMER_ID: 'CUS002' },
    { OR_ID: 3, ORDER_NO: 'ORD-003', ORDER_DATE: '2024-01-25', AMOUNT_US: 234.75, STATUS: 'Completed', CUSTOMER_ID: 'CUS003' },
  ],
  suppliers: [
    { SUP_ID: 'SUP001', COMPANY: 'TechPro Supplies', FIRST_NAME: 'John', LAST_NAME: 'Smith', PHONE: '555-0101', E_MAIL: 'john@techpro.com', ADDRESS: '123 Tech St', STATUS: 'Active' },
    { SUP_ID: 'SUP002', COMPANY: 'Global Electronics', FIRST_NAME: 'Sarah', LAST_NAME: 'Johnson', PHONE: '555-0102', E_MAIL: 'sarah@globalelec.com', ADDRESS: '456 Global Ave', STATUS: 'Active' },
  ],
  users: [
    { UserID: 1, Username: 'admin', Password: 'admin123', FullName: 'Administrator', Role: 'Admin', Status: 'ACTIVE' },
    { UserID: 2, Username: 'cashier', Password: 'cashier123', FullName: 'Cashier User', Role: 'Cashier', Status: 'ACTIVE' },
  ]
};

// ============================================
// CRITICAL FIX: Replace parameters in SQL
// ============================================
function replaceParams(sql, params) {
  if (!params || params.length === 0) return sql;
  
  let processedSql = sql;
  let paramIndex = 0;
  
  // Replace ? with actual values
  processedSql = processedSql.replace(/\?/g, (match) => {
    const param = params[paramIndex++];
    
    if (param === null || param === undefined) {
      return 'NULL';
    }
    
    if (typeof param === 'string' && param.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date format: wrap in # for Access
      return `#${param}#`;
    } else if (typeof param === 'string') {
      // String: wrap in quotes and escape single quotes
      return `'${param.replace(/'/g, "''")}'`;
    } else if (typeof param === 'number') {
      // Number: use as-is
      return param;
    } else if (typeof param === 'boolean') {
      // Boolean: convert to 0/1
      return param ? 1 : 0;
    } else {
      // Other: convert to string and wrap in quotes
      return `'${String(param).replace(/'/g, "''")}'`;
    }
  });
  
  return processedSql;
}

/**
 * Log query errors with detailed ODBC information
 */
function logQueryError(label, err, sql) {
  console.error(`❌ ${label}:`, err.message);
  
  if (err.odbcErrors && err.odbcErrors.length) {
    err.odbcErrors.forEach((odbcErr, index) => {
      console.error(`❌ ODBC detail ${index + 1}:`, JSON.stringify(odbcErr, null, 2));
    });
  }
  
  if (sql) {
    console.error('❌ SQL:', sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Stack:', err.stack);
  }
}

/**
 * Initialize database connection
 */
async function initDatabase() {
  if (isInitialized) {
    return connection;
  }
  isInitialized = true;

  // If we're on Vercel or non-Windows, skip ODBC
  if (!odbc) {
    console.log('ℹ️ ODBC not available - running in demo/mock mode');
    isConnected = true;
    return null;
  }

  try {
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Access database not found at:', dbPath);
      console.log('📁 Please make sure spms.accdb is in the database folder');
      console.log('📁 Current path:', __dirname);
      isConnected = true;
      return null;
    }

    console.log('🔗 Connecting to Access Database...');
    console.log(`📁 Path: ${dbPath}`);
    console.log(`📁 File exists: ${fs.existsSync(dbPath)}`);
    console.log(`📁 File size: ${fs.statSync(dbPath).size} bytes`);

    const connectionStrings = [
      `DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};`,
      `DRIVER={Microsoft Access Driver (*.mdb)};DBQ=${dbPath};`,
      `DRIVER={Microsoft Access-Treiber (*.mdb)};DBQ=${dbPath};`,
      `DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};ExtendedAnsiSQL=1;`,
    ];

    let lastError = null;

    for (const connStr of connectionStrings) {
      try {
        console.log(`🔌 Trying connection: ${connStr.substring(0, 50)}...`);
        connection = await odbc.connect(connStr);
        console.log('✅ Connected to Access Database successfully!');
        break;
      } catch (err) {
        lastError = err;
        console.log(`⚠️ Connection attempt failed: ${err.message}`);
        continue;
      }
    }

    if (!connection) {
      console.error('❌ All connection attempts failed:', lastError?.message);
      isConnected = true;
      return null;
    }

    try {
      const result = await connection.query('SELECT 1 as test');
      console.log('✅ Database test query successful!');
      isConnected = true;
    } catch (testErr) {
      console.error('❌ Test query failed:', testErr.message);
      
      try {
        const tables = await connection.query("SELECT name FROM MSysObjects WHERE Type=1 AND Flags=0");
        console.log(`✅ Found ${tables?.length || 0} tables in database`);
        isConnected = true;
      } catch (tableErr) {
        console.error('❌ Could not list tables:', tableErr.message);
        isConnected = true;
      }
    }

    if (connection && isConnected) {
      try {
        await connection.query('SET ANSI_NULLS ON');
        await connection.query('SET QUOTED_IDENTIFIER ON');
        console.log('✅ Connection options configured');
      } catch (optErr) {
        console.log('ℹ️ Some connection options not supported (ignored)');
      }
    }

    return connection;
  } catch (err) {
    console.error('❌ Failed to connect to Access:', err.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Install Microsoft Access Database Engine:');
    console.log('   https://www.microsoft.com/en-us/download/details.aspx?id=54920');
    console.log('2. Close Access if it\'s open (file lock)');
    console.log('3. Make sure spms.accdb exists in the database folder');
    console.log('4. Try running PowerShell as Administrator');
    console.log('5. Check if you have 32-bit or 64-bit Office installed');
    console.log('6. Verify the file is not corrupted');
    isConnected = true;
    return null;
  }
}

/**
 * Execute a query and return a single row
 */
function get(sql, params = [], callback) {
  // Process SQL to replace ? with actual values
  const processedSql = replaceParams(sql, params);
  
  // If no ODBC, return mock data
  if (!odbc || !connection || !isConnected) {
    console.log('ℹ️ ODBC not available - returning mock data for:', sql.substring(0, 50));
    try {
      const mockResult = executeMockQuery(sql, params);
      const row = mockResult && mockResult.length > 0 ? mockResult[0] : null;
      if (callback) callback(null, row);
    } catch (err) {
      if (callback) callback(err, null);
    }
    return;
  }

  connection.query(processedSql)
    .then(result => {
      const row = result && result.length > 0 ? result[0] : null;
      callback(null, row);
    })
    .catch(err => {
      logQueryError('Query error (get)', err, processedSql);
      // Fallback to mock data
      try {
        const mockResult = executeMockQuery(sql, params);
        const row = mockResult && mockResult.length > 0 ? mockResult[0] : null;
        callback(null, row);
      } catch (mockErr) {
        callback(err, null);
      }
    });
}

/**
 * Execute a query and return all rows
 */
function all(sql, params = [], callback) {
  // Process SQL to replace ? with actual values
  const processedSql = replaceParams(sql, params);
  
  // If no ODBC, return mock data
  if (!odbc || !connection || !isConnected) {
    console.log('ℹ️ ODBC not available - returning mock data for:', sql.substring(0, 50));
    try {
      const mockResult = executeMockQuery(sql, params);
      if (callback) callback(null, mockResult || []);
    } catch (err) {
      if (callback) callback(err, []);
    }
    return;
  }

  connection.query(processedSql)
    .then(result => {
      callback(null, result || []);
    })
    .catch(err => {
      logQueryError('Query error (all)', err, processedSql);
      // Fallback to mock data
      try {
        const mockResult = executeMockQuery(sql, params);
        callback(null, mockResult || []);
      } catch (mockErr) {
        callback(err, []);
      }
    });
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
function run(sql, params = [], callback) {
  // Process SQL to replace ? with actual values
  const processedSql = replaceParams(sql, params);
  
  // If no ODBC, return mock result
  if (!odbc || !connection || !isConnected) {
    console.log('ℹ️ ODBC not available - mock run for:', sql.substring(0, 50));
    try {
      const result = executeMockQuery(sql, params);
      const mockThis = {
        lastID: result.lastID || Date.now(),
        changes: result.changes || 1
      };
      if (callback) callback.call(mockThis, null);
    } catch (err) {
      if (callback) callback(err);
    }
    return;
  }

  connection.query(processedSql)
    .then(result => {
      let insertId = 0;
      
      if (result && result.insertId !== undefined) {
        insertId = result.insertId;
      } else if (result && result.affectedRows !== undefined) {
        insertId = result.affectedRows;
      } else {
        // Try to get last inserted ID
        connection.query('SELECT @@IDENTITY as id')
          .then(idResult => {
            if (idResult && idResult.length > 0) {
              insertId = idResult[0].id || 0;
            }
            callback.call({ lastID: insertId }, null);
          })
          .catch(() => {
            callback.call({ lastID: insertId }, null);
          });
        return;
      }
      
      callback.call({ lastID: insertId }, null);
    })
    .catch(err => {
      logQueryError('Execute error (run)', err, processedSql);
      // Fallback to mock
      try {
        const result = executeMockQuery(sql, params);
        const mockThis = {
          lastID: result.lastID || Date.now(),
          changes: result.changes || 1
        };
        callback.call(mockThis, null);
      } catch (mockErr) {
        callback(err);
      }
    });
}

/**
 * Execute a transaction (serialize)
 */
function serialize(callback) {
  try {
    callback();
  } catch (err) {
    console.error('❌ Serialize error:', err.message);
  }
}

/**
 * Execute a query with prepared statement
 */
function prepare(sql, callback) {
  if (!odbc || !connection || !isConnected) {
    console.log('ℹ️ ODBC not available - mock prepare for:', sql.substring(0, 50));
    if (callback) {
      callback(null, {
        sql: sql,
        all: function(params, cb) {
          all(sql, params, cb);
        },
        run: function(params, cb) {
          run(sql, params, cb);
        }
      });
    }
    return;
  }

  callback(null, {
    sql: sql,
    all: function(params, cb) {
      all(sql, params, cb);
    },
    run: function(params, cb) {
      run(sql, params, cb);
    }
  });
}

/**
 * Mock query executor
 */
function executeMockQuery(sql, params = []) {
  // Simple mock - return mock data based on table name
  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  if (tableMatch) {
    const table = tableMatch[1].toUpperCase();
    if (table.includes('CUSTOMER')) return mockData.customers;
    if (table.includes('PRODUCT')) return mockData.products;
    if (table.includes('STOCK')) return mockData.stock;
    if (table.includes('ORDER')) return mockData.orders;
    if (table.includes('SUPPLIER')) return mockData.suppliers;
    if (table.includes('USER')) return mockData.users;
  }
  return [];
}

/**
 * Get connection status
 */
function getConnection() {
  return connection;
}

/**
 * Check if connected
 */
function isDbConnected() {
  return isConnected;
}

// ============================================
// CONNECTION POOLING
// ============================================

const connectionPool = [];

async function getPooledConnection() {
  if (connectionPool.length > 0) {
    return connectionPool.pop();
  }
  
  if (!connection || !isConnected) {
    await initDatabase();
  }
  
  return connection;
}

function releaseConnection(conn) {
  if (conn && connectionPool.length < 10) {
    connectionPool.push(conn);
  }
}

// ============================================
// CLEANUP
// ============================================

process.on('exit', () => {
  if (connection) {
    try {
      connection.close();
      console.log('🔌 Database connection closed');
    } catch (err) {
      // Ignore
    }
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

module.exports = {
  initDatabase,
  get,
  all,
  run,
  serialize,
  prepare,
  getConnection,
  isConnected: isDbConnected,
  getPooledConnection,
  releaseConnection
};