const odbc = require('odbc');
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
  
  // Log ODBC specific errors
  if (err.odbcErrors && err.odbcErrors.length) {
    err.odbcErrors.forEach((odbcErr, index) => {
      console.error(`❌ ODBC detail ${index + 1}:`, JSON.stringify(odbcErr, null, 2));
    });
  }
  
  // Log the SQL that caused the error
  if (sql) {
    console.error('❌ SQL:', sql.substring(0, 500) + (sql.length > 500 ? '...' : ''));
  }
  
  // Log error stack for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Stack:', err.stack);
  }
}

/**
 * Initialize database connection
 */
async function initDatabase() {
  try {
    // Check if Access database exists
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Access database not found at:', dbPath);
      console.log('📁 Please make sure spms.accdb is in the database folder');
      console.log('📁 Current path:', __dirname);
      return null;
    }

    console.log('🔗 Connecting to Access Database...');
    console.log(`📁 Path: ${dbPath}`);
    console.log(`📁 File exists: ${fs.existsSync(dbPath)}`);
    console.log(`📁 File size: ${fs.statSync(dbPath).size} bytes`);

    // Try different connection strings
    const connectionStrings = [
      `DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${dbPath};`,
      `DRIVER={Microsoft Access Driver (*.mdb)};DBQ=${dbPath};`,
      `DRIVER={Microsoft Access-Treiber (*.mdb)};DBQ=${dbPath};`,
      // For 64-bit systems with 32-bit Access installed
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
      return null;
    }

    // Test the connection with a simple query
    try {
      const result = await connection.query('SELECT 1 as test');
      console.log('✅ Database test query successful!');
      isConnected = true;
    } catch (testErr) {
      console.error('❌ Test query failed:', testErr.message);
      
      // Try to get table list instead (more reliable for Access)
      try {
        const tables = await connection.query("SELECT name FROM MSysObjects WHERE Type=1 AND Flags=0");
        console.log(`✅ Found ${tables?.length || 0} tables in database`);
        isConnected = true;
      } catch (tableErr) {
        console.error('❌ Could not list tables:', tableErr.message);
        // Still consider connected if we got this far
        isConnected = true;
      }
    }

    // Set connection options for better compatibility
    if (connection && isConnected) {
      try {
        // Enable better SQL compatibility
        await connection.query('SET ANSI_NULLS ON');
        await connection.query('SET QUOTED_IDENTIFIER ON');
        console.log('✅ Connection options configured');
      } catch (optErr) {
        // Ignore - these options might not be supported in all Access versions
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
    return null;
  }
}

/**
 * Execute a query and return a single row
 */
function get(sql, params = [], callback) {
  if (!connection || !isConnected) {
    console.error('❌ Not connected to database');
    return callback(new Error('Not connected to database'), null);
  }

  // Ensure params is an array
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
  if (!connection || !isConnected) {
    console.error('❌ Not connected to database');
    return callback(new Error('Not connected to database'), null);
  }

  // Ensure params is an array
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
  if (!connection || !isConnected) {
    console.error('❌ Not connected to database');
    return callback(new Error('Not connected to database'));
  }

  // Ensure params is an array
  const queryParams = Array.isArray(params) ? params : [];

  connection.query(sql, queryParams)
    .then(result => {
      // For Access, the insertId might not always be available
      // Try to get it from the result or use a fallback
      let insertId = 0;
      
      if (result && result.insertId !== undefined) {
        insertId = result.insertId;
      } else if (result && result.affectedRows !== undefined) {
        // Some drivers use affectedRows instead
        insertId = result.affectedRows;
      } else {
        // Fallback: try to get the last inserted ID
        // Note: This might not work for all Access versions
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
          // Ignore if we can't get the ID
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
  // For Access, we just execute the callback
  // Access doesn't support transactions in the same way as SQL Server
  try {
    callback();
  } catch (err) {
    console.error('❌ Serialize error:', err.message);
  }
}

/**
 * Execute a query with prepared statement (for security)
 */
function prepare(sql, callback) {
  if (!connection || !isConnected) {
    console.error('❌ Not connected to database');
    return callback(new Error('Not connected to database'), null);
  }

  // For Access, we'll just return the query string
  // and let the caller use it with all/run
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
// CONNECTION POOLING (optional)
// ============================================

// Store multiple connections if needed
const connectionPool = [];

/**
 * Get a connection from the pool (or create one)
 */
async function getPooledConnection() {
  if (connectionPool.length > 0) {
    return connectionPool.pop();
  }
  
  if (!connection || !isConnected) {
    await initDatabase();
  }
  
  return connection;
}

/**
 * Return a connection to the pool
 */
function releaseConnection(conn) {
  if (conn && connectionPool.length < 10) {
    connectionPool.push(conn);
  }
}

// ============================================
// CLEANUP
// ============================================

// Close connection on process exit
process.on('exit', () => {
  if (connection) {
    try {
      connection.close();
      console.log('🔌 Database connection closed');
    } catch (err) {
      // Ignore close errors
    }
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

// Handle unhandled rejections
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
  // Connection pool functions
  getPooledConnection,
  releaseConnection
};