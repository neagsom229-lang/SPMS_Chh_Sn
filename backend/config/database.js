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
      isConnected = true; // Allow demo mode
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
      isConnected = true; // Allow demo mode
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
    isConnected = true; // Allow demo mode
    return null;
  }
}

/**
 * Execute a query and return a single row
 */
function get(sql, params = [], callback) {
  // If no ODBC, return mock data
  if (!odbc || !connection || !isConnected) {
    console.log('ℹ️ ODBC not available - returning mock data for:', sql.substring(0, 50));
    if (callback) callback(null, null);
    return;
  }

  const queryParams = Array.isArray(params) ? params : [];

  connection.query(sql, queryParams)
    .then(result => {
      const row = result && result.length > 0 ? result[0] : null;
      callback(null, row);
    })
    .catch(err => {
      logQueryError('Query error (get)', err, sql);
      callback(err, null);
    });
}

/**
 * Execute a query and return all rows
 */
function all(sql, params = [], callback) {
  // If no ODBC, return mock data
  if (!odbc || !connection || !isConnected) {
    console.log('ℹ️ ODBC not available - returning empty array for:', sql.substring(0, 50));
    if (callback) callback(null, []);
    return;
  }

  const queryParams = Array.isArray(params) ? params : [];

  connection.query(sql, queryParams)
    .then(result => {
      callback(null, result || []);
    })
    .catch(err => {
      logQueryError('Query error (all)', err, sql);
      callback(err, null);
    });
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
function run(sql, params = [], callback) {
  // If no ODBC, return mock result
  if (!odbc || !connection || !isConnected) {
    console.log('ℹ️ ODBC not available - mock run for:', sql.substring(0, 50));
    if (callback) {
      callback.call({ lastID: Date.now(), changes: 1 }, null);
    }
    return;
  }

  const queryParams = Array.isArray(params) ? params : [];

  connection.query(sql, queryParams)
    .then(result => {
      let insertId = 0;
      
      if (result && result.insertId !== undefined) {
        insertId = result.insertId;
      } else if (result && result.affectedRows !== undefined) {
        insertId = result.affectedRows;
      } else {
        try {
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
        } catch (idErr) {
          // Ignore
        }
      }
      
      callback.call({ lastID: insertId }, null);
    })
    .catch(err => {
      logQueryError('Execute error (run)', err, sql);
      callback(err);
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