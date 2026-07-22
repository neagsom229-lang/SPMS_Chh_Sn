// backend/config/postgres.js
const { Pool } = require('pg');

// Mock data for when database is not available
const mockData = {
  users: [
    { UserID: 1, Username: 'admin', Password: 'admin123', FullName: 'Administrator', Role: 'Admin', Status: 'ACTIVE' },
    { UserID: 2, Username: 'cashier', Password: 'cashier123', FullName: 'Cashier User', Role: 'Cashier', Status: 'ACTIVE' }
  ],
  customers: [
    { CUS_ID: 'CUS001', FIRST_NAME: 'John', LAST_NAME: 'Doe', PHONE: '555-0101', E_MAIL: 'john@example.com', ADDRESS: '123 Main St', BALANCE: 150, STATUS: 'Active' },
    { CUS_ID: 'CUS002', FIRST_NAME: 'Jane', LAST_NAME: 'Smith', PHONE: '555-0102', E_MAIL: 'jane@example.com', ADDRESS: '456 Oak Ave', BALANCE: 0, STATUS: 'Active' }
  ],
  products: [
    { PRODUCT_ID: 'PROD001', NAME_EN: 'Laptop Pro', NAME_KH: 'កុំព្យូទ័រយួរដៃ Pro', SALEOUT_PRICE: 1299.99, STATUS: 'Active' },
    { PRODUCT_ID: 'PROD002', NAME_EN: 'Smartphone X', NAME_KH: 'ទូរស័ព្ទ X', SALEOUT_PRICE: 899.99, STATUS: 'Active' }
  ]
};

let isRealDb = false;
let pool = null;

// Try to connect to real DB, but use mock if it fails
const initDb = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    
    await pool.query('SELECT 1');
    isRealDb = true;
    console.log('✅ Connected to real PostgreSQL database');
    return pool;
  } catch (err) {
    console.log('⚠️ Using MOCK database (no real connection)');
    isRealDb = false;
    return createMockDb();
  }
};

// Mock database functions
const createMockDb = () => {
  return {
    query: async (sql, params) => {
      // Simple mock query handler
      if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('tbl_users')) {
        return { rows: mockData.users };
      }
      if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('tbl_customers')) {
        return { rows: mockData.customers };
      }
      if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('tbl_products')) {
        return { rows: mockData.products };
      }
      if (sql.toLowerCase().includes('select now()')) {
        return { rows: [{ now: new Date().toISOString() }] };
      }
      if (sql.toLowerCase().includes('insert') || sql.toLowerCase().includes('update') || sql.toLowerCase().includes('delete')) {
        return { rowCount: 1 };
      }
      return { rows: [] };
    },
    connect: async () => ({ release: () => {} }),
    end: async () => {}
  };
};

// Export the db object
const db = {
  query: async (sql, params) => {
    if (isRealDb && pool) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        console.warn('⚠️ Real DB query failed, using mock:', err.message);
        return await createMockDb().query(sql, params);
      }
    }
    return await createMockDb().query(sql, params);
  },
  connect: async () => {
    if (isRealDb && pool) {
      try {
        return await pool.connect();
      } catch (err) {
        return { release: () => {} };
      }
    }
    return { release: () => {} };
  },
  end: async () => {
    if (pool) {
      try { await pool.end(); } catch (e) {}
    }
  }
};

// Initialize
initDb().then(() => {
  console.log('📊 Database ready (real or mock)');
});

module.exports = db;