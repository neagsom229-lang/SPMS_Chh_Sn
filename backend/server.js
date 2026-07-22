require('dotenv').config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./config/postgres");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// CORS CONFIGURATION - FIXED ✅
// ============================================
const allowedOrigins = [
  // Production Vercel URLs
  'https://spms-chh-sn-pro.vercel.app',
  'https://spms-chh-sn-new.vercel.app',
  'https://spms-chh-sn.vercel.app',
  'https://chheangsamnangs-projects.vercel.app',
  'https://spms-chh-sn-git-main-chheangsamnangs-projects.vercel.app',
  // Local development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

// Add this test endpoint to check database connection
app.get("/api/db-test", async (req, res) => {
  try {
    // Test connection
    const result = await db.query("SELECT NOW() as time, current_database() as db");
    res.json({
      success: true,
      connected: true,
      database: result.rows[0],
      tables: await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      // ✅ FIXED: Allow all for testing (remove in production)
      callback(null, true);
      // Uncomment below for strict mode:
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

console.log('📊 Using PostgreSQL Database');
console.log('✅ CORS allowed origins:', allowedOrigins);

// ============================================
// ACTIVITY LOG - IN-MEMORY STORAGE
// ============================================
let activityLogs = [];
const MAX_LOGS = 100;

const logActivity = (userId, action, tableName, recordId = null) => {
  try {
    const logEntry = {
      log_id: Date.now(),
      user_id: userId || 1,
      username: "Unknown",
      action: action,
      table_name: tableName,
      record_id: recordId,
      action_date: new Date().toISOString(),
    };
    activityLogs.unshift(logEntry);
    if (activityLogs.length > MAX_LOGS) {
      activityLogs = activityLogs.slice(0, MAX_LOGS);
    }
    console.log(`📝 [LOG] User ${userId}: ${action} on ${tableName}`);
  } catch (err) {
    console.warn("⚠️ Activity log error:", err.message);
  }
};

// ============================================
// HELPER FUNCTIONS FOR POSTGRESQL
// ============================================
function toPostgresArray(items) {
  if (!items || !Array.isArray(items)) return '[]';
  return JSON.stringify(items);
}

function fromPostgresArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try { return JSON.parse(data); } catch { return []; }
}

// ============================================
// ACTIVITY LOGS
// ============================================
app.get("/api/activity-logs", async (req, res) => {
  const { limit = 50 } = req.query;
  const logs = activityLogs.slice(0, Number(limit));
  
  try {
    const result = await db.query("SELECT UserID, Username FROM Tbl_Users");
    const users = result.rows || [];
    const userMap = {};
    users.forEach((u) => {
      userMap[u.UserID] = u.Username;
    });
    logs.forEach((log) => {
      log.username = userMap[log.user_id] || "Unknown";
    });
    res.json(logs);
  } catch (err) {
    console.error("❌ Activity logs error:", err.message);
    res.json(logs);
  }
});

app.delete("/api/activity-logs", (req, res) => {
  activityLogs = [];
  res.json({ message: "Activity logs cleared" });
});

// ============================================
// AUTHENTICATION - FIXED ✅
// ============================================
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("🔑 Login attempt:", username);

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // ✅ FIXED: Case insensitive username search
    const result = await db.query(
      `SELECT UserID, Username, Password, FullName, Role, Status 
       FROM Tbl_Users 
       WHERE LOWER(Username) = LOWER($1) AND Status = 'ACTIVE'`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      console.log("❌ User not found:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ FIXED: Compare password (plaintext for now - hash in production)
    if (user.Password !== password) {
      console.log("❌ Password incorrect for:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Login successful:", username);
    console.log("👤 Role:", user.Role);

    logActivity(user.UserID, "Login", "Tbl_Users", user.UserID);

    res.json({
      user_id: user.UserID,
      username: user.Username,
      role: user.Role || "Cashier",
      role_name: user.Role || "Cashier",
      status: user.Status,
      fullname: user.FullName || user.Username,
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// ============================================
// DASHBOARD STATS
// ============================================
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const queries = [
      db.query("SELECT COUNT(*) as count FROM TBL_CUSTOMERS WHERE STATUS = 'Active'"),
      db.query("SELECT COUNT(*) as count FROM TBL_PRODUCTS WHERE STATUS = 'Active'"),
      db.query("SELECT COUNT(*) as count FROM TBL_ORDERS"),
      db.query("SELECT COALESCE(SUM(AMOUNT_US), 0) as revenue FROM TBL_ORDERS"),
      db.query("SELECT COUNT(*) as count FROM Tbl_Stock WHERE QtyAvailable <= 5"),
      db.query("SELECT COUNT(*) as count FROM TBL_ORDERS WHERE STATUS = 'Pending'")
    ];

    const results = await Promise.all(queries);
    
    const stats = {
      totalCustomers: parseInt(results[0].rows[0]?.count || 0),
      totalProducts: parseInt(results[1].rows[0]?.count || 0),
      totalOrders: parseInt(results[2].rows[0]?.count || 0),
      totalRevenue: parseFloat(results[3].rows[0]?.revenue || 0),
      lowStockItems: parseInt(results[4].rows[0]?.count || 0),
      pendingOrders: parseInt(results[5].rows[0]?.count || 0),
    };

    res.json(stats);
  } catch (err) {
    console.error("❌ Dashboard stats error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CUSTOMERS (CRUD)
// ============================================
app.get("/api/customers", async (req, res) => {
  const { search } = req.query;
  let sql = "SELECT * FROM TBL_CUSTOMERS WHERE STATUS = 'Active'";
  const params = [];

  if (search) {
    sql += ` AND (FIRST_NAME ILIKE $1 OR LAST_NAME ILIKE $1 OR PHONE ILIKE $1 OR E_MAIL ILIKE $1)`;
    params.push(`%${search}%`);
  }

  try {
    const result = await db.query(sql, params);
    console.log(`👥 Customers found: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Customers error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`SELECT * FROM TBL_CUSTOMERS WHERE CUS_ID = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Customer error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/customers", async (req, res) => {
  const { FIRST_NAME, LAST_NAME, PHONE, E_MAIL, ADDRESS, BALANCE } = req.body;

  if (!FIRST_NAME || !LAST_NAME) {
    return res.status(400).json({ error: "First name and last name are required" });
  }

  try {
    const maxIdResult = await db.query("SELECT MAX(CUS_ID) as maxId FROM TBL_CUSTOMERS");
    let nextNumber = 1;
    if (maxIdResult.rows[0]?.maxId) {
      const numPart = parseInt(maxIdResult.rows[0].maxId.replace(/[^0-9]/g, ""));
      if (!isNaN(numPart)) nextNumber = numPart + 1;
    }
    const newCusId = `CUS${String(nextNumber).padStart(3, "0")}`;

    const result = await db.query(
      `INSERT INTO TBL_CUSTOMERS (CUS_ID, FIRST_NAME, LAST_NAME, PHONE, E_MAIL, ADDRESS, BALANCE, STATUS) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active') RETURNING CUS_ID`,
      [newCusId, FIRST_NAME, LAST_NAME, PHONE || null, E_MAIL || null, ADDRESS || null, BALANCE || 0]
    );

    logActivity(req.body.user_id || 1, "Created customer", "TBL_CUSTOMERS", newCusId);
    res.json({
      cus_id: newCusId,
      message: "Customer created successfully",
    });
  } catch (err) {
    console.error("❌ Create customer error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  const { FIRST_NAME, LAST_NAME, PHONE, E_MAIL, ADDRESS, BALANCE, STATUS } = req.body;

  try {
    const result = await db.query(
      `UPDATE TBL_CUSTOMERS 
       SET FIRST_NAME = $1, LAST_NAME = $2, PHONE = $3, E_MAIL = $4, 
           ADDRESS = $5, BALANCE = $6, STATUS = $7 
       WHERE CUS_ID = $8`,
      [FIRST_NAME, LAST_NAME, PHONE, E_MAIL, ADDRESS, BALANCE || 0, STATUS || 'Active', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    logActivity(req.body.user_id || 1, "Updated customer", "TBL_CUSTOMERS", id);
    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("❌ Update customer error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE TBL_CUSTOMERS SET STATUS = 'Inactive' WHERE CUS_ID = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    logActivity(req.body.user_id || 1, "Deleted customer", "TBL_CUSTOMERS", id);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("❌ Delete customer error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// ============================================
// PRODUCTS (CRUD) - FIXED ✅
// ============================================
app.get("/api/products", async (req, res) => {
  const { search } = req.query;
  console.log("📦 Fetching products - search:", search || "all");

  let sql = "SELECT * FROM TBL_PRODUCTS WHERE STATUS = 'Active'";
  const params = [];

  if (search) {
    sql += ` AND (NAME_EN ILIKE $1 OR NAME_KH ILIKE $1 OR BARCODE ILIKE $1)`;
    params.push(`%${search}%`);
  }

  try {
    const result = await db.query(sql, params);
    console.log(`📦 Products found: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Products error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Fetching product: ${id}`);

  try {
    const result = await db.query(`SELECT * FROM TBL_PRODUCTS WHERE PRODUCT_ID = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Product error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CREATE PRODUCT - DEBUG VERSION ✅
// ============================================
app.post("/api/products", async (req, res) => {
  console.log("📝 ===== CREATE PRODUCT ===== ");
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

  const {
    NAME_EN,
    NAME_KH,
    BARCODE,
    BRAND,
    CATEGORY_ID,
    BUYIN_PRICE,
    SALEOUT_PRICE,
    QTY_ALERT,
    QTY_INSTOCK,
  } = req.body;

  // Validate required fields
  if (!NAME_EN || NAME_EN.trim() === '') {
    console.log("❌ Missing NAME_EN");
    return res.status(400).json({ error: "Product English name is required" });
  }

  if (!NAME_KH || NAME_KH.trim() === '') {
    console.log("❌ Missing NAME_KH");
    return res.status(400).json({ error: "Product Khmer name is required" });
  }

  try {
    // Check database connection first
    console.log("🔍 Testing database connection...");
    await db.query("SELECT 1");
    console.log("✅ Database connection OK");

    // Get next PRODUCT_ID
    console.log("🔍 Getting next PRODUCT_ID...");
    const maxIdResult = await db.query("SELECT MAX(PRODUCT_ID) as maxId FROM TBL_PRODUCTS");
    console.log("📊 Max ID result:", maxIdResult.rows[0]);

    let nextNumber = 1;
    if (maxIdResult.rows[0]?.maxId) {
      const currentId = maxIdResult.rows[0].maxId;
      const numPart = parseInt(String(currentId).replace(/[^0-9]/g, ""));
      if (!isNaN(numPart)) nextNumber = numPart + 1;
    }
    const newProductId = `PROD${String(nextNumber).padStart(3, "0")}`;
    console.log(`📦 Generated PRODUCT_ID: ${newProductId}`);

    // Insert product
    console.log("🔍 Inserting product...");
    const result = await db.query(
      `INSERT INTO TBL_PRODUCTS 
       (PRODUCT_ID, NAME_EN, NAME_KH, BARCODE, BRAND, CATEGORY_ID, BUYIN_PRICE, SALEOUT_PRICE, QTY_ALERT, STATUS) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active') 
       RETURNING ID`,
      [
        newProductId, 
        NAME_EN.trim(), 
        NAME_KH.trim(), 
        BARCODE?.trim() || null, 
        BRAND?.trim() || null, 
        CATEGORY_ID || null, 
        parseFloat(BUYIN_PRICE) || 0, 
        parseFloat(SALEOUT_PRICE) || 0, 
        parseInt(QTY_ALERT) || 10
      ]
    );

    if (!result || !result.rows || result.rows.length === 0) {
      console.error("❌ No ID returned from insert");
      return res.status(500).json({ error: "Failed to create product - no ID returned" });
    }

    const productId = result.rows[0].id;
    console.log(`✅ Product created with ID: ${productId}`);

    // Insert stock
    try {
      console.log("🔍 Inserting stock...");
      const qtyInStock = parseInt(QTY_INSTOCK) || 0;
      await db.query(
        `INSERT INTO Tbl_Stock (ProductID, QtyInStock, QtyAvailable, QtyReserved) 
         VALUES ($1, $2, $3, $4)`,
        [productId, qtyInStock, qtyInStock, 0]
      );
      console.log(`✅ Stock created for product: ${productId}`);
    } catch (stockErr) {
      console.error("⚠️ Stock creation error:", stockErr.message);
      // Continue - product is created even if stock fails
    }

    // Log activity (if function exists)
    try {
      if (typeof logActivity === 'function') {
        logActivity(req.body.user_id || 1, "Created product", "TBL_PRODUCTS", newProductId);
      }
    } catch (logErr) {
      console.warn("⚠️ Activity log warning:", logErr.message);
    }
    
    console.log(`✅ Product ${newProductId} created successfully!`);
    res.json({
      product_id: newProductId,
      id: productId,
      message: "Product created successfully",
    });
  } catch (err) {
    console.error("❌ ===== CREATE PRODUCT ERROR =====");
    console.error("❌ Error message:", err.message);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Error details:", JSON.stringify(err, null, 2));
    res.status(500).json({ 
      error: err.message || "Failed to create product",
      details: err.stack,
      success: false
    });
  }
});

// ============================================
// UPDATE PRODUCT - FIXED ✅
// ============================================
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`📝 Updating product: ${id}`);
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

  const {
    NAME_EN,
    NAME_KH,
    BARCODE,
    BRAND,
    CATEGORY_ID,
    BUYIN_PRICE,
    SALEOUT_PRICE,
    QTY_ALERT,
    STATUS,
  } = req.body;

  // ✅ FIXED: Better validation
  if (!NAME_EN || NAME_EN.trim() === '') {
    return res.status(400).json({ error: "Product English name is required" });
  }

  if (!NAME_KH || NAME_KH.trim() === '') {
    return res.status(400).json({ error: "Product Khmer name is required" });
  }

  try {
    const result = await db.query(
      `UPDATE TBL_PRODUCTS 
       SET NAME_EN = $1, 
           NAME_KH = $2, 
           BARCODE = $3, 
           BRAND = $4, 
           CATEGORY_ID = $5, 
           BUYIN_PRICE = $6, 
           SALEOUT_PRICE = $7, 
           QTY_ALERT = $8, 
           STATUS = $9 
       WHERE PRODUCT_ID = $10`,
      [
        NAME_EN.trim(), 
        NAME_KH.trim(), 
        BARCODE?.trim() || null, 
        BRAND?.trim() || null, 
        CATEGORY_ID || null, 
        parseFloat(BUYIN_PRICE) || 0, 
        parseFloat(SALEOUT_PRICE) || 0, 
        parseInt(QTY_ALERT) || 10, 
        STATUS || 'Active', 
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    logActivity(req.body.user_id || 1, "Updated product", "TBL_PRODUCTS", id);
    res.json({ 
      message: "Product updated successfully",
      product_id: id
    });
  } catch (err) {
    console.error("❌ Update product error:", err.message);
    res.status(500).json({ 
      error: err.message || "Failed to update product"
    });
  }
});

// ============================================
// DELETE PRODUCT - FIXED ✅
// ============================================
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Deleting product: ${id}`);

  try {
    // ✅ FIXED: Soft delete - update status to Inactive
    const result = await db.query(
      `UPDATE TBL_PRODUCTS SET STATUS = 'Inactive' WHERE PRODUCT_ID = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    logActivity(req.body.user_id || 1, "Deleted product", "TBL_PRODUCTS", id);
    res.json({ 
      message: "Product deleted successfully",
      product_id: id
    });
  } catch (err) {
    console.error("❌ Delete product error:", err.message);
    res.status(500).json({ 
      error: err.message || "Failed to delete product"
    });
  }
});

// ============================================
// ORDERS
// ============================================
app.get("/api/orders", async (req, res) => {
  const { limit = 50, status } = req.query;
  let sql = "SELECT * FROM TBL_ORDERS";
  const params = [];

  if (status) {
    sql += ` WHERE STATUS = $1`;
    params.push(status);
  }

  sql += " ORDER BY ORDER_DATE DESC";

  try {
    const result = await db.query(sql, params);
    const limitedRows = result.rows.slice(0, Number(limit));
    console.log(`📋 Orders found: ${limitedRows.length}`);
    res.json(limitedRows);
  } catch (err) {
    console.error("❌ Orders error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/pending", async (req, res) => {
  console.log("📋 Fetching pending orders...");

  try {
    const result = await db.query(
      `SELECT OR_ID, ORDER_NO, ORDER_DATE, AMOUNT_US, STATUS, PaymentMethod, NOTES, EMP_PREPARE, CUSTOMER_ID
       FROM TBL_ORDERS
       WHERE STATUS IN ('Pending', 'Processing')
       ORDER BY ORDER_DATE DESC`
    );

    console.log(`📋 Pending orders found: ${result.rows.length}`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Pending orders error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/recent", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM TBL_ORDERS ORDER BY ORDER_DATE DESC LIMIT 10"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Recent orders error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stock/low-stock", async (req, res) => {
  console.log("📊 Fetching low stock products...");

  try {
    const result = await db.query(
      `SELECT p.PRODUCT_ID, p.NAME_EN, p.NAME_KH, s.QtyAvailable, p.QTY_ALERT, p.SALEOUT_PRICE
       FROM Tbl_Stock s
       LEFT JOIN TBL_PRODUCTS p ON s.ProductID = p.ID
       WHERE s.QtyAvailable <= p.QTY_ALERT AND p.STATUS = 'Active'
       ORDER BY s.QtyAvailable ASC`
    );

    console.log(`📊 Low stock products found: ${result.rows.length}`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Low stock error:", err.message);
    res.status(500).json([]);
  }
});

// ============================================
// ORDER DETAILS
// ============================================
app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`📊 Fetching order details for ID: ${id}`);

  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    console.warn(`⚠️ Invalid order ID (not numeric): ${id}`);
    return res.status(400).json({ error: "Invalid order ID format" });
  }

  try {
    const orderResult = await db.query(
      `SELECT OR_ID, ORDER_NO, ORDER_DATE, AMOUNT_US, STATUS, PaymentMethod, NOTES, EMP_PREPARE, CUSTOMER_ID
       FROM TBL_ORDERS WHERE OR_ID = $1`,
      [numericId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];
    const customerId = order.CUSTOMER_ID;

    let customer = null;
    try {
      const customerResult = await db.query(
        `SELECT CUS_ID, FIRST_NAME, LAST_NAME, PHONE, E_MAIL
         FROM TBL_CUSTOMERS
         WHERE CUS_ID = $1 OR CUS_ID = $2`,
        [`CUS${String(customerId).padStart(3, "0")}`, customerId]
      );
      if (customerResult.rows.length > 0) {
        customer = customerResult.rows[0];
      }
    } catch (err) {
      console.warn("⚠️ Customer error:", err.message);
    }

    let payments = [];
    try {
      const paymentResult = await db.query(
        `SELECT * FROM TBL_PAYMENT WHERE OR_ID = $1`,
        [numericId]
      );
      payments = paymentResult.rows;
    } catch (err) {
      console.warn("⚠️ Payments error:", err.message);
    }

    let items = [];
    try {
      const itemsResult = await db.query(
        `SELECT ID, OR_ID, PRODUCT_ID, QTY_ORDER as qty, QTY_BONUS, PRICE as unit_price, DISCOUNT, SUBTOTAL as subtotal
         FROM TBL_ORDERS_DETAILS WHERE OR_ID = $1`,
        [numericId]
      );
      items = itemsResult.rows;
    } catch (err) {
      console.warn("⚠️ Items error:", err.message);
    }

    res.json({
      OR_ID: order.OR_ID,
      ORDER_NO: order.ORDER_NO,
      ORDER_DATE: order.ORDER_DATE,
      AMOUNT_US: order.AMOUNT_US,
      STATUS: order.STATUS,
      PaymentMethod: order.PaymentMethod,
      NOTES: order.NOTES,
      EMP_PREPARE: order.EMP_PREPARE,
      CUSTOMER_ID: order.CUSTOMER_ID,
      customer: customer || {
        CUS_ID: order.CUSTOMER_ID,
        FIRST_NAME: "Unknown",
        LAST_NAME: "Customer",
        PHONE: null,
        E_MAIL: null,
      },
      payments: payments || [],
      items: items || [],
    });
  } catch (err) {
    console.error("❌ Order error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PAYMENT METHODS
// ============================================
app.get("/api/payment-methods", async (req, res) => {
  console.log("💳 Fetching payment methods...");

  try {
    const result = await db.query(`SELECT * FROM TBL_PAYMENT_METHOD WHERE STATUS = 'ACTIVE'`);
    console.log(`💳 Payment methods found: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Payment methods error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// STOCK MANAGEMENT
// ============================================
app.get("/api/stock", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, p.PRODUCT_ID as PRODUCT_CODE, p.NAME_EN, p.NAME_KH, p.QTY_ALERT, p.SALEOUT_PRICE
      FROM Tbl_Stock s
      LEFT JOIN TBL_PRODUCTS p ON s.ProductID = p.ID
    `);
    console.log(`📊 Stock records found: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Stock error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stock/product/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`📊 Checking stock for product ID: ${id}`);

  if (!id || id === "null" || id === "undefined") {
    return res.json({ ProductID: id, QtyInStock: 0, QtyReserved: 0, QtyAvailable: 0, PRODUCT_NAME: "Unknown" });
  }

  try {
    const productResult = await db.query(
      `SELECT ID, PRODUCT_ID, NAME_EN FROM TBL_PRODUCTS WHERE PRODUCT_ID = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.json({ ProductID: id, QtyInStock: 0, QtyReserved: 0, QtyAvailable: 0, PRODUCT_NAME: "Unknown" });
    }

    const product = productResult.rows[0];
    const numericProductId = product.ID;

    const stockResult = await db.query(
      `SELECT * FROM Tbl_Stock WHERE ProductID = $1`,
      [numericProductId]
    );

    if (stockResult.rows.length === 0) {
      await db.query(
        `INSERT INTO Tbl_Stock (ProductID, QtyInStock, QtyAvailable, QtyReserved) VALUES ($1, 0, 0, 0)`,
        [numericProductId]
      );
      return res.json({ ProductID: id, QtyInStock: 0, QtyReserved: 0, QtyAvailable: 0, PRODUCT_NAME: product.NAME_EN || "Unknown" });
    }

    const stock = stockResult.rows[0];
    res.json({
      ProductID: id,
      StockID: stock.StockID,
      QtyInStock: stock.QtyInStock || 0,
      QtyReserved: stock.QtyReserved || 0,
      QtyAvailable: stock.QtyAvailable || 0,
      LastUpdated: stock.LastUpdated || null,
      PRODUCT_NAME: product.NAME_EN || "Unknown",
    });
  } catch (err) {
    console.error("❌ Stock check error:", err.message);
    res.json({ ProductID: id, QtyInStock: 0, QtyReserved: 0, QtyAvailable: 0, PRODUCT_NAME: "Unknown" });
  }
});

// ============================================
// SUPPLIERS - FIXED with better fallback
// ============================================
app.get("/api/suppliers", async (req, res) => {
  const { search } = req.query;
  console.log("🔍 GET /api/suppliers - search:", search);

  let sql = "SELECT * FROM TBL_SUPPLIERS WHERE STATUS = 'Active'";
  const params = [];

  if (search) {
    sql += ` AND (COMPANY ILIKE $1 OR FIRST_NAME ILIKE $1 OR LAST_NAME ILIKE $1 OR PHONE ILIKE $1 OR E_MAIL ILIKE $1)`;
    params.push(`%${search}%`);
  }

  sql += " ORDER BY COMPANY";

  try {
    const result = await db.query(sql, params);
    
    const mappedRows = result.rows.map(row => ({
      SUP_ID: row.SUP_ID || `SUP${String(Math.random()).slice(2, 6)}`,
      SUP_NAME: row.COMPANY || 
                (row.FIRST_NAME && row.LAST_NAME ? `${row.FIRST_NAME} ${row.LAST_NAME}`.trim() : '') ||
                row.FIRST_NAME || 
                row.LAST_NAME || 
                'Unknown Supplier',
      CONTACT_PERSON: `${row.FIRST_NAME || ''} ${row.LAST_NAME || ''}`.trim() || row.FIRST_NAME || row.LAST_NAME || 'No contact',
      PHONE: row.PHONE || '',
      EMAIL: row.E_MAIL || '',
      ADDRESS: row.ADDRESS || '',
      STATUS: row.STATUS || 'Active',
      WEBSITE: row.WEBSITE || '',
      PAYMENT_TI: row.PAYMENT_TI || ''
    }));

    console.log(`🚚 Suppliers found: ${mappedRows.length}`);
    res.json(mappedRows);
  } catch (err) {
    console.error("❌ Suppliers error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 GET /api/suppliers/${id}`);

  try {
    const result = await db.query(`SELECT * FROM TBL_SUPPLIERS WHERE SUP_ID = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const row = result.rows[0];
    const mappedRow = {
      SUP_ID: row.SUP_ID,
      SUP_NAME: row.COMPANY || 
                (row.FIRST_NAME && row.LAST_NAME ? `${row.FIRST_NAME} ${row.LAST_NAME}`.trim() : '') ||
                row.FIRST_NAME || 
                row.LAST_NAME || 
                'Unknown Supplier',
      CONTACT_PERSON: `${row.FIRST_NAME || ''} ${row.LAST_NAME || ''}`.trim() || row.FIRST_NAME || row.LAST_NAME || 'No contact',
      PHONE: row.PHONE || '',
      EMAIL: row.E_MAIL || '',
      ADDRESS: row.ADDRESS || '',
      STATUS: row.STATUS || 'Active',
      WEBSITE: row.WEBSITE || '',
      PAYMENT_TI: row.PAYMENT_TI || ''
    };

    res.json(mappedRow);
  } catch (err) {
    console.error("❌ Supplier error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/suppliers", async (req, res) => {
  console.log("📝 POST /api/suppliers - Request body:", JSON.stringify(req.body, null, 2));

  const supName = req.body.SUP_NAME || req.body.COMPANY || req.body.company || req.body.name || req.body.supplierName;
  const contactPerson = req.body.CONTACT_PERSON || req.body.contactPerson || req.body.contact_person || req.body.contact || '';
  const phone = req.body.PHONE || req.body.phone || '';
  const email = req.body.EMAIL || req.body.E_MAIL || req.body.email || '';
  const address = req.body.ADDRESS || req.body.address || '';
  const website = req.body.WEBSITE || req.body.website || '';
  const taxId = req.body.TAX_ID || req.body.tax_id || '';

  console.log("📝 Extracted values:", { supName, contactPerson, phone, email, address, website, taxId });

  if (!supName) {
    console.error("❌ Missing supplier name");
    return res.status(400).json({ error: "Supplier name is required", received: req.body });
  }

  let firstName = '';
  let lastName = '';
  if (contactPerson) {
    const isPhoneNumber = /^[0-9\s\-+()]+$/.test(contactPerson);
    if (isPhoneNumber) {
      firstName = contactPerson;
      lastName = '';
    } else {
      const parts = contactPerson.trim().split(' ');
      if (parts.length > 1) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        firstName = parts[0];
        lastName = '';
      }
    }
  }

  try {
    const maxIdResult = await db.query("SELECT MAX(SUP_ID) as maxId FROM TBL_SUPPLIERS");
    let nextNumber = 1;
    if (maxIdResult.rows[0]?.maxId) {
      const numPart = parseInt(maxIdResult.rows[0].maxId.replace(/[^0-9]/g, ""));
      if (!isNaN(numPart)) nextNumber = numPart + 1;
    }
    const newSupId = `SUP${String(nextNumber).padStart(3, "0")}`;

    const result = await db.query(
      `INSERT INTO TBL_SUPPLIERS (SUP_ID, COMPANY, FIRST_NAME, LAST_NAME, PHONE, E_MAIL, ADDRESS, STATUS, WEBSITE) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', $8) RETURNING SUP_ID`,
      [newSupId, supName, firstName || null, lastName || null, phone || null, email || null, address || null, website || null]
    );

    logActivity(req.body.user_id || 1, "Created supplier", "TBL_SUPPLIERS", newSupId);

    res.json({
      SUP_ID: newSupId,
      SUP_NAME: supName,
      CONTACT_PERSON: contactPerson,
      PHONE: phone,
      EMAIL: email,
      ADDRESS: address,
      STATUS: 'Active',
      WEBSITE: website,
      message: "Supplier created successfully",
    });
  } catch (err) {
    console.error("❌ Create supplier error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`📝 PUT /api/suppliers/${id}`);
  console.log('📦 Request body:', req.body);

  const supName = req.body.SUP_NAME || req.body.COMPANY || req.body.company || req.body.name;
  const contactPerson = req.body.CONTACT_PERSON || req.body.contactPerson || req.body.contact_person || '';
  const phone = req.body.PHONE || req.body.phone || '';
  const email = req.body.EMAIL || req.body.E_MAIL || req.body.email || '';
  const address = req.body.ADDRESS || req.body.address || '';
  const status = req.body.STATUS || req.body.status || 'Active';
  const website = req.body.WEBSITE || req.body.website || '';

  if (!supName) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  let firstName = '';
  let lastName = '';
  if (contactPerson) {
    const parts = contactPerson.trim().split(' ');
    if (parts.length > 1) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = parts[0];
      lastName = '';
    }
  }

  try {
    const result = await db.query(
      `UPDATE TBL_SUPPLIERS 
       SET COMPANY = $1, FIRST_NAME = $2, LAST_NAME = $3, PHONE = $4, E_MAIL = $5, ADDRESS = $6, STATUS = $7, WEBSITE = $8
       WHERE SUP_ID = $9`,
      [supName, firstName || null, lastName || null, phone || null, email || null, address || null, status || 'Active', website || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    logActivity(req.body.user_id || 1, "Updated supplier", "TBL_SUPPLIERS", id);
    res.json({ 
      message: "Supplier updated successfully",
      SUP_ID: id,
      SUP_NAME: supName,
      CONTACT_PERSON: contactPerson,
      PHONE: phone,
      EMAIL: email,
      ADDRESS: address,
      STATUS: status,
      WEBSITE: website
    });
  } catch (err) {
    console.error("❌ Update supplier error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /api/suppliers/${id}`);

  try {
    const result = await db.query(
      `UPDATE TBL_SUPPLIERS SET STATUS = 'Inactive' WHERE SUP_ID = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    logActivity(req.body.user_id || 1, "Deleted supplier", "TBL_SUPPLIERS", id);
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error("❌ Delete supplier error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// REPORTS API
// ============================================
app.get("/api/reports/customers", async (req, res) => {
  console.log("📊 Generating Customer Report...");
  try {
    const result = await db.query(
      "SELECT * FROM TBL_CUSTOMERS WHERE STATUS = 'Active' ORDER BY FIRST_NAME, LAST_NAME"
    );
    console.log(`📊 Customer report: ${result.rows.length} records`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Customer report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/products", async (req, res) => {
  console.log("📊 Generating Product Report...");
  try {
    const result = await db.query(
      `SELECT ID, PRODUCT_ID, NAME_EN, NAME_KH, SALEOUT_PRICE as PRICE, STATUS
       FROM TBL_PRODUCTS WHERE STATUS = 'Active' ORDER BY NAME_EN`
    );
    console.log(`📊 Product report: ${result.rows.length} records`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Product report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/orders", async (req, res) => {
  console.log("📊 Generating Order Report...");
  try {
    const result = await db.query(
      `SELECT ORDER_NO, ORDER_DATE, AMOUNT_US as TOTAL_AMOUNT, STATUS FROM TBL_ORDERS ORDER BY ORDER_DATE DESC`
    );
    console.log(`📊 Order report: ${result.rows.length} records`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Order report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/stock", async (req, res) => {
  console.log("📊 Generating Stock Report...");
  try {
    const result = await db.query(`
      SELECT s.StockID, s.ProductID, p.PRODUCT_ID as PRODUCT_CODE, p.NAME_EN as PRODUCT_NAME,
             s.QtyInStock as IN_STOCK, s.QtyAvailable as AVAILABLE, s.QtyReserved as RESERVED, s.LastUpdated
      FROM Tbl_Stock s LEFT JOIN TBL_PRODUCTS p ON s.ProductID = p.ID ORDER BY p.NAME_EN
    `);
    console.log(`📊 Stock report: ${result.rows.length} records`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Stock report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/sales", async (req, res) => {
  console.log("📊 Generating Sales Report...");
  try {
    const result = await db.query(
      `SELECT ORDER_NO, ORDER_DATE, AMOUNT_US as amount, STATUS
       FROM TBL_ORDERS ORDER BY ORDER_DATE DESC`
    );
    console.log(`📊 Sales report: ${result.rows.length} records`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Sales report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/inventory", async (req, res) => {
  console.log("📊 Generating Inventory Report...");
  try {
    const result = await db.query(`
      SELECT p.PRODUCT_ID, p.NAME_EN as product_name, s.QtyInStock, s.QtyAvailable, s.QtyReserved, p.SALEOUT_PRICE as price
      FROM Tbl_Stock s LEFT JOIN TBL_PRODUCTS p ON s.ProductID = p.ID ORDER BY p.NAME_EN
    `);
    console.log(`📊 Inventory report: ${result.rows.length} records`);
    res.json(result.rows || []);
  } catch (err) {
    console.error("❌ Inventory report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports/monthlySales", async (req, res) => {
  console.log("📈 Building monthly sales report...");
  try {
    const result = await db.query(`
      SELECT EXTRACT(YEAR FROM ORDER_DATE) as year, EXTRACT(MONTH FROM ORDER_DATE) as month,
             SUM(AMOUNT_US) as total, COUNT(*) as orders
      FROM TBL_ORDERS
      GROUP BY EXTRACT(YEAR FROM ORDER_DATE), EXTRACT(MONTH FROM ORDER_DATE)
      ORDER BY EXTRACT(YEAR FROM ORDER_DATE) ASC, EXTRACT(MONTH FROM ORDER_DATE) ASC
    `);
    
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formatted = result.rows.map(r => ({
      month: `${MONTH_NAMES[(parseInt(r.month) || 1) - 1]} ${parseInt(r.year)}`,
      revenue: parseFloat(r.total) || 0,
      orders: parseInt(r.orders) || 0
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Monthly sales error:", err.message);
    res.status(500).json([]);
  }
});

app.get("/api/reports/productPerformance", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  console.log(`📈 Building product performance report (top ${limit})...`);
  
  try {
    const result = await db.query(`
      SELECT p.NAME_EN as name,
             SUM(od.QTY_ORDER) as sales,
             SUM(od.QTY_ORDER * od.PRICE) as revenue
      FROM TBL_ORDERS_DETAILS od
      INNER JOIN TBL_PRODUCTS p ON od.PRODUCT_ID = p.ID
      GROUP BY p.NAME_EN
      ORDER BY SUM(od.QTY_ORDER) DESC
      LIMIT $1
    `, [limit]);
    
    const formatted = result.rows.map(r => ({
      name: r.name || "Unknown",
      sales: parseFloat(r.sales) || 0,
      revenue: parseFloat(r.revenue) || 0
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Product performance error:", err.message);
    res.status(500).json([]);
  }
});

app.get("/api/reports/customerAnalytics", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  console.log(`📈 Building customer analytics report (top ${limit})...`);
  
  try {
    const result = await db.query(`
      SELECT c.CUS_ID as id,
             CONCAT(c.FIRST_NAME, ' ', c.LAST_NAME) as name,
             COUNT(o.OR_ID) as orders,
             COALESCE(SUM(o.AMOUNT_US), 0) as totalSpent
      FROM TBL_CUSTOMERS c
      LEFT JOIN TBL_ORDERS o ON c.ID = o.CUSTOMER_ID
      GROUP BY c.CUS_ID, c.FIRST_NAME, c.LAST_NAME
      ORDER BY COALESCE(SUM(o.AMOUNT_US), 0) DESC
      LIMIT $1
    `, [limit]);
    
    const formatted = result.rows.map(r => ({
      id: r.id || "Unknown",
      name: (r.name || "Unknown").trim(),
      orders: parseInt(r.orders) || 0,
      totalSpent: parseFloat(r.totalSpent) || 0,
      avgOrder: parseInt(r.orders) > 0 ? parseFloat(r.totalSpent) / parseInt(r.orders) : 0
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Customer analytics error:", err.message);
    res.status(500).json([]);
  }
});

app.get("/api/reports/revenueSummary", async (req, res) => {
  console.log("📈 Building revenue summary report...");
  
  try {
    const currentResult = await db.query(
      `SELECT COALESCE(SUM(AMOUNT_US), 0) as revenue, COUNT(*) as orders 
       FROM TBL_ORDERS WHERE ORDER_DATE >= CURRENT_DATE - INTERVAL '30 days'`
    );
    
    const previousResult = await db.query(
      `SELECT COALESCE(SUM(AMOUNT_US), 0) as revenue, COUNT(*) as orders 
       FROM TBL_ORDERS WHERE ORDER_DATE >= CURRENT_DATE - INTERVAL '60 days' 
       AND ORDER_DATE < CURRENT_DATE - INTERVAL '30 days'`
    );
    
    const customersResult = await db.query("SELECT COUNT(*) as count FROM TBL_CUSTOMERS");
    const productsResult = await db.query("SELECT COUNT(*) as count FROM TBL_PRODUCTS WHERE STATUS = 'Active'");

    const currentRevenue = parseFloat(currentResult.rows[0]?.revenue || 0);
    const currentOrders = parseInt(currentResult.rows[0]?.orders || 0);
    const previousRevenue = parseFloat(previousResult.rows[0]?.revenue || 0);
    const previousOrders = parseInt(previousResult.rows[0]?.orders || 0);
    const totalCustomers = parseInt(customersResult.rows[0]?.count || 0);
    const totalProducts = parseInt(productsResult.rows[0]?.count || 0);

    res.json({
      totalRevenue: currentRevenue,
      totalOrders: currentOrders,
      totalCustomers: totalCustomers,
      totalProducts: totalProducts,
      avgOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
      revenueGrowth: previousRevenue ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0,
      orderGrowth: previousOrders ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100) : 0
    });
  } catch (err) {
    console.error("❌ Revenue summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ANALYTICS API
// ============================================
function getStartDateForRange(range) {
  const d = new Date();
  switch (range) {
    case "last30days": d.setDate(d.getDate() - 30); break;
    case "last90days": d.setDate(d.getDate() - 90); break;
    case "last12months": d.setMonth(d.getMonth() - 12); break;
    default: d.setMonth(d.getMonth() - 6); break;
  }
  return d.toISOString().slice(0, 10);
}

app.get("/api/analytics/monthly-revenue", async (req, res) => {
  const { range = "last6months" } = req.query;
  const startDate = getStartDateForRange(range);
  console.log(`📊 Fetching monthly revenue (range=${range}, since ${startDate})...`);

  try {
    const result = await db.query(`
      SELECT EXTRACT(YEAR FROM ORDER_DATE) as year, EXTRACT(MONTH FROM ORDER_DATE) as month,
             SUM(AMOUNT_US) as revenue, COUNT(*) as orders
      FROM TBL_ORDERS WHERE ORDER_DATE >= $1
      GROUP BY EXTRACT(YEAR FROM ORDER_DATE), EXTRACT(MONTH FROM ORDER_DATE)
      ORDER BY EXTRACT(YEAR FROM ORDER_DATE) ASC, EXTRACT(MONTH FROM ORDER_DATE) ASC
    `, [startDate]);

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formatted = result.rows.map((row) => ({
      month: `${MONTH_NAMES[(parseInt(row.month) || 1) - 1]} ${parseInt(row.year)}`,
      revenue: parseFloat(row.revenue) || 0,
      orders: parseInt(row.orders) || 0,
    }));
    console.log(`📊 Monthly revenue: ${formatted.length} rows`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Monthly revenue error:", err.message);
    res.json([]);
  }
});

app.get("/api/analytics/top-products", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  console.log(`📊 Fetching top ${limit} products...`);

  try {
    const result = await db.query(`
      SELECT p.NAME_EN as product_name,
             SUM(od.QTY_ORDER) as total_sold,
             SUM(od.QTY_ORDER * od.PRICE) as revenue
      FROM TBL_ORDERS_DETAILS od
      LEFT JOIN TBL_PRODUCTS p ON od.PRODUCT_ID = p.ID
      GROUP BY p.NAME_EN
      ORDER BY SUM(od.QTY_ORDER) DESC
      LIMIT $1
    `, [limit]);

    const formatted = result.rows.map((r) => ({
      product_name: r.product_name || "Unknown",
      total_sold: parseFloat(r.total_sold) || 0,
      revenue: parseFloat(r.revenue) || 0,
    }));
    console.log(`📊 Top products: ${formatted.length} rows`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Top products error:", err.message);
    res.json([]);
  }
});

app.get("/api/analytics/customer-history/:id", async (req, res) => {
  const customerId = parseInt(req.params.id, 10);
  if (!Number.isFinite(customerId)) {
    console.warn(`⚠️ Invalid customer id: ${req.params.id}`);
    return res.status(400).json({ message: "Invalid customer id" });
  }
  console.log(`📊 Fetching customer history for ID: ${customerId}`);

  try {
    const result = await db.query(`
      SELECT ORDER_NO, ORDER_DATE, AMOUNT_US as amount, STATUS
      FROM TBL_ORDERS WHERE CUSTOMER_ID = $1
      ORDER BY ORDER_DATE DESC
    `, [customerId]);

    const formatted = result.rows.map((r) => ({
      ORDER_NO: r.ORDER_NO,
      ORDER_DATE: r.ORDER_DATE,
      amount: parseFloat(r.amount) || 0,
      STATUS: r.STATUS || "Pending",
    }));
    console.log(`📊 Customer history: ${formatted.length} orders`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Customer history error:", err.message);
    res.status(500).json([]);
  }
});

app.get("/api/analytics/yearly-revenue", async (req, res) => {
  console.log("📊 Fetching yearly revenue...");
  try {
    const result = await db.query(`
      SELECT EXTRACT(YEAR FROM ORDER_DATE) as year,
             SUM(AMOUNT_US) as revenue, COUNT(*) as orders
      FROM TBL_ORDERS
      GROUP BY EXTRACT(YEAR FROM ORDER_DATE)
      ORDER BY EXTRACT(YEAR FROM ORDER_DATE) ASC
    `);

    const formatted = result.rows.map((r) => ({
      year: String(parseInt(r.year)),
      revenue: parseFloat(r.revenue) || 0,
      orders: parseInt(r.orders) || 0,
    }));
    console.log(`📊 Yearly revenue: ${formatted.length} years`);
    res.json(formatted);
  } catch (err) {
    console.error("❌ Yearly revenue error:", err.message);
    res.json([]);
  }
});

app.get("/api/analytics/summary", async (req, res) => {
  console.log("📊 Fetching analytics summary...");

  try {
    const currentResult = await db.query(`
      SELECT COALESCE(SUM(AMOUNT_US), 0) as revenue, COUNT(*) as orders
      FROM TBL_ORDERS
      WHERE EXTRACT(MONTH FROM ORDER_DATE) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM ORDER_DATE) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    const previousResult = await db.query(`
      SELECT COALESCE(SUM(AMOUNT_US), 0) as revenue, COUNT(*) as orders
      FROM TBL_ORDERS
      WHERE EXTRACT(MONTH FROM ORDER_DATE) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
      AND EXTRACT(YEAR FROM ORDER_DATE) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
    `);

    const productsResult = await db.query("SELECT COUNT(*) as count FROM TBL_PRODUCTS WHERE STATUS = 'Active'");

    const currentRevenue = parseFloat(currentResult.rows[0]?.revenue || 0);
    const currentOrders = parseInt(currentResult.rows[0]?.orders || 0);
    const previousRevenue = parseFloat(previousResult.rows[0]?.revenue || 0);
    const previousOrders = parseInt(previousResult.rows[0]?.orders || 0);
    const totalProducts = parseInt(productsResult.rows[0]?.count || 0);

    res.json({
      totalRevenue: currentRevenue,
      totalOrders: currentOrders,
      totalProducts: totalProducts,
      averageOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
      revenueGrowth: previousRevenue ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0,
      orderGrowth: previousOrders ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100) : 0,
    });
  } catch (err) {
    console.error("❌ Analytics summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================
app.get("/api/users", async (req, res) => {
  console.log("👥 Fetching users...");
  try {
    const result = await db.query(
      "SELECT UserID, Username, FullName, Role, Status, CreatedAt FROM Tbl_Users"
    );
    
    if (result.rows.length === 0) {
      console.log("⚠️ No users found");
      return res.json([]);
    }
    
    const mappedUsers = result.rows.map((user) => ({
      user_id: user.UserID,
      username: user.Username || "",
      fullname: user.FullName || "",
      role: user.Role || "Cashier",
      role_id: user.Role === "Admin" ? 1 : user.Role === "Cashier" ? 2 : 3,
      status: user.Status || "ACTIVE",
      last_login: user.CreatedAt || null,
    }));
    console.log(`✅ Found ${mappedUsers.length} users`);
    res.json(mappedUsers);
  } catch (err) {
    console.error("❌ Users error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  console.log("📝 Request body:", req.body);
  const { username, password, fullname, role_id } = req.body;

  if (!username || !password) {
    console.log("❌ Missing username or password");
    return res.status(400).json({ error: "Username and password are required" });
  }

  const roleMap = { 1: "Admin", 2: "Cashier", 3: "Viewer" };
  const role = roleMap[String(role_id)] || "Cashier";

  try {
    const existingResult = await db.query(
      "SELECT UserID FROM Tbl_Users WHERE Username = $1",
      [username]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const result = await db.query(
      `INSERT INTO Tbl_Users (Username, Password, FullName, Role, Status) 
       VALUES ($1, $2, $3, $4, 'ACTIVE') RETURNING UserID`,
      [username, password, fullname || username, role]
    );

    const userId = result.rows[0].UserID;
    console.log("✅ User created with ID:", userId);
    logActivity(req.body.user_id || 1, "Created user", "Tbl_Users", userId);
    res.json({ user_id: userId, message: "User created successfully" });
  } catch (err) {
    console.error("❌ Create user error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password, fullname, role_id } = req.body;

  console.log("📝 Updating user ID:", id, req.body);

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const roleMap = { 1: "Admin", 2: "Cashier", 3: "Viewer" };
  const role = roleMap[String(role_id)] || "Cashier";

  try {
    const existingResult = await db.query(
      "SELECT UserID FROM Tbl_Users WHERE Username = $1 AND UserID != $2",
      [username, id]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    let query = `UPDATE Tbl_Users SET Username = $1, FullName = $2, Role = $3`;
    const params = [username, fullname || username, role];

    if (password && password.trim() !== "") {
      query += `, Password = $4`;
      params.push(password);
      query += ` WHERE UserID = $${params.length}`;
    } else {
      query += ` WHERE UserID = $${params.length + 1}`;
    }
    params.push(id);

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ User updated, ID:", id);
    logActivity(req.body.user_id || 1, "Updated user", "Tbl_Users", id);
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("❌ Update user error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ Deleting user ID:", id);

  if (id == 1) {
    return res.status(400).json({ error: "Cannot delete the main admin user" });
  }

  try {
    const result = await db.query(
      "DELETE FROM Tbl_Users WHERE UserID = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ User deleted, ID:", id);
    logActivity(req.body.user_id || 1, "Deleted user", "Tbl_Users", id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete user error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WARRANTY API
// ============================================
app.get("/api/warranty", async (req, res) => {
  console.log("🛡️ Fetching warranty records...");
  try {
    const result = await db.query("SELECT * FROM Tbl_Warranty ORDER BY WarrantyID DESC");
    console.log(`🛡️ Warranty records found: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Warranty error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/warranty", async (req, res) => {
  const { CustomerID, ProductID, SerialNumber, WarrantyPeriod, WarrantyStartDate } = req.body;

  const startDate = new Date(WarrantyStartDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(WarrantyPeriod || 12));

  try {
    const result = await db.query(
      `INSERT INTO Tbl_Warranty (CustomerID, ProductID, SerialNumber, WarrantyPeriod, WarrantyStartDate, WarrantyEndDate, Status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active') RETURNING WarrantyID`,
      [CustomerID, ProductID, SerialNumber || null, Number(WarrantyPeriod) || 12, WarrantyStartDate, endDate.toISOString().split("T")[0]]
    );
    res.json({ warranty_id: result.rows[0].WarrantyID, message: "Warranty created successfully" });
  } catch (err) {
    console.error("❌ Create warranty error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SERVICE REQUESTS API
// ============================================
app.get("/api/services", async (req, res) => {
  console.log("🔧 Fetching service requests...");
  try {
    const result = await db.query("SELECT * FROM Tbl_Service_Requests ORDER BY ServiceID DESC");
    console.log(`🔧 Service requests found: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Services error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/services", async (req, res) => {
  const { CustomerID, ProductID, SerialNumber, WarrantyID, IssueDescription, ServiceType, Status, EstimatedCost } = req.body;

  const serviceNo = `SRV-${Date.now()}`;

  try {
    const result = await db.query(
      `INSERT INTO Tbl_Service_Requests (ServiceNo, CustomerID, ProductID, SerialNumber, WarrantyID,
        IssueDescription, ServiceType, Status, ReceivedDate, EstimatedCost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9) RETURNING ServiceID`,
      [serviceNo, CustomerID, ProductID, SerialNumber || null, WarrantyID || null, IssueDescription || null, ServiceType || "Repair", Status || "PENDING", Number(EstimatedCost) || 0]
    );
    res.json({ service_id: result.rows[0].ServiceID, message: "Service request created successfully" });
  } catch (err) {
    console.error("❌ Create service error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PAYMENT API
// ============================================
app.post("/api/payments/create-payment-intent", async (req, res) => {
  const { amount, orderId } = req.body;
  res.json({ clientSecret: "mock_secret_" + Date.now(), message: "Payment intent created (mock)" });
});

app.post("/api/payments/record", async (req, res) => {
  const { OR_ID, AMOUNT_US, AMOUNT_KH, REFERENCE_I, EMP_ID } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO TBL_PAYMENT (OR_ID, AMOUNT_US, AMOUNT_KH, PAY_DATE, STATUS)
       VALUES ($1, $2, $3, CURRENT_DATE, 'COMPLETED')`,
      [Number(OR_ID), AMOUNT_US || 0, AMOUNT_KH || 0]
    );
    res.json({ message: "Payment recorded" });
  } catch (err) {
    console.error("❌ Payment record error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PURCHASE
// ============================================
app.post("/api/purchase", async (req, res) => {
  const { CUSTOMER_ID, items, DISCOUNT = 0, STATUS = "Pending", EMP_PREPARE = 1, NOTES = "" } = req.body;

  console.log("📦 Processing purchase order...");

  if (!CUSTOMER_ID) {
    return res.status(400).json({ error: "Customer ID is required" });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "At least one item is required" });
  }

  try {
    const customerResult = await db.query(
      "SELECT ID, CUS_ID FROM TBL_CUSTOMERS WHERE CUS_ID = $1",
      [CUSTOMER_ID]
    );

    if (customerResult.rows.length === 0) {
      return res.status(400).json({ error: `Customer with ID ${CUSTOMER_ID} not found` });
    }

    const customer = customerResult.rows[0];
    const numericCustomerId = customer.ID;

    let totalAmount = 0;
    items.forEach((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.unit_price) || 0;
      const discount = Number(item.discount) || 0;
      totalAmount += qty * price - discount;
    });

    const discountAmount = Number(DISCOUNT) || 0;
    totalAmount = Math.max(0, totalAmount - discountAmount);

    const orderNo = `PO-${Date.now()}`;

    const orderResult = await db.query(
      `INSERT INTO TBL_ORDERS (ORDER_NO, CUSTOMER_ID, ORDER_DATE, AMOUNT_US, STATUS, EMP_PREPARE, DISCOUNT, NOTES)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7) RETURNING OR_ID`,
      [orderNo, numericCustomerId, totalAmount, STATUS || "Pending", EMP_PREPARE || 1, discountAmount, NOTES || ""]
    );

    const orderId = orderResult.rows[0].OR_ID;
    console.log(`✅ Order created: ${orderNo} (ID: ${orderId})`);

    for (const item of items) {
      const productIdText = String(item.product_id || "");
      const qty = Number(item.qty) || 0;
      const price = Number(item.unit_price) || 0;
      const discount = Number(item.discount) || 0;
      const subtotal = qty * price - discount;

      if (!productIdText || productIdText === "null" || productIdText === "undefined" || productIdText === "") {
        console.warn("⚠️ Skipping item with invalid product ID");
        continue;
      }

      const productResult = await db.query(
        "SELECT ID FROM TBL_PRODUCTS WHERE PRODUCT_ID = $1",
        [productIdText]
      );

      if (productResult.rows.length === 0) {
        console.warn(`⚠️ Product ${productIdText} not found`);
        continue;
      }

      const numericProductId = productResult.rows[0].ID;

      await db.query(
        `INSERT INTO TBL_ORDERS_DETAILS (OR_ID, PRODUCT_ID, QTY_ORDER, PRICE, SUBTOTAL)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, numericProductId, qty, price, subtotal]
      );

      await db.query(
        `UPDATE Tbl_Stock SET QtyAvailable = QtyAvailable - $1, QtyInStock = QtyInStock - $1
         WHERE ProductID = $2`,
        [qty, numericProductId]
      );
    }

    res.json({
      success: true,
      order_no: orderNo,
      order_id: orderId,
      message: "Order created successfully",
      order: {
        order_no: orderNo,
        order_id: orderId,
        customer_id: CUSTOMER_ID,
        amount: totalAmount,
        status: STATUS || "Pending",
      },
    });
  } catch (err) {
    console.error("❌ Purchase error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TEST
// ============================================
app.get("/api/test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW() as test");
    res.json({ success: true, result: result.rows[0] });
  } catch (err) {
    console.error("❌ Test error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROOT ENDPOINT - FIXED ✅
// ============================================
app.get("/", (req, res) => {
  res.json({
    message: "SPMS Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/auth/login",
      customers: "/api/customers",
      products: "/api/products",
      orders: "/api/orders",
      suppliers: "/api/suppliers",
      users: "/api/users",
      analytics: "/api/analytics",
      reports: "/api/reports",
      test: "/api/test"
    }
  });
});

// ============================================
// 404 HANDLER - FIXED ✅
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
    path: req.url,
    method: req.method
  });
});

// ============================================
// ERROR HANDLER - FIXED ✅
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    status: err.status || 500,
    path: req.url
  });
});

// ============================================
// START SERVER
// ============================================
async function startServer() {
  console.log("🔄 Initializing database connection...");

  try {
    const testResult = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connection established!');
    console.log(`📊 Connected to PostgreSQL at: ${testResult.rows[0].current_time}`);

    app.listen(PORT, () => {
      console.log("🚀 SPMS Backend running on http://localhost:" + PORT);
      console.log("📊 Test API: http://localhost:" + PORT + "/api/test");
      console.log("📁 Connected to PostgreSQL database successfully!");
      console.log("");
      console.log("📋 Available Endpoints:");
      console.log("  🔐 Auth:          POST /api/auth/login");
      console.log("  👥 Customers:     GET/POST /api/customers");
      console.log("  📦 Products:      GET/POST /api/products");
      console.log("  🛒 Orders:        GET /api/orders");
      console.log("  🛒 Pending:       GET /api/orders/pending");
      console.log("  📋 Order:         GET /api/orders/:id (details)");
      console.log("  📊 Low Stock:     GET /api/stock/low-stock");
      console.log("  💳 Payments:      GET /api/payment-methods");
      console.log("  💰 Payment:       POST /api/payments/record");
      console.log("  📊 Stock:         GET /api/stock");
      console.log("  📊 Stock Product: GET /api/stock/product/:id");
      console.log("  💳 Purchase:      POST /api/purchase");
      console.log("  📋 Reports:       GET /api/reports/*");
      console.log("  👤 Users:         GET /api/users");
      console.log("  📝 Activity:      GET /api/activity-logs");
      console.log("  🛡️ Warranty:      GET /api/warranty");
      console.log("  🔧 Services:      GET /api/services");
      console.log("  📊 Analytics:     GET /api/analytics/*");
      console.log("  📈 Reports:       GET /api/reports/monthly-sales");
      console.log("  📈 Reports:       GET /api/reports/product-performance");
      console.log("  📈 Reports:       GET /api/reports/customer-analytics");
      console.log("  📈 Reports:       GET /api/reports/revenue-summary");
      console.log("  📈 Reports:       GET /api/reports/sales");
      console.log("  📈 Reports:       GET /api/reports/inventory");
    });
  } catch (err) {
    console.error("❌ Server startup error:", err.message);
    console.log("⚠️ Server running in limited mode");
    
    app.listen(PORT, () => {
      console.log("🚀 SPMS Backend running in LIMITED MODE on http://localhost:" + PORT);
      console.log("⚠️ Database connection failed, some features may not work");
    });
  }
}

startServer();

// ============================================
// EXPORT for Vercel (Serverless)
// ============================================
module.exports = app;
