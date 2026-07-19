// backend/routes/products.js
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/products - list all products (with category name)
router.get("/", (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.CATEGORY_EN, c.CATEGORY_KH
       FROM TBL_PRODUCTS p
       LEFT JOIN TBL_CATEGORY c ON c.ID = p.CATEGORY_ID
       ORDER BY p.ID`
    )
    .all();
  res.json(rows);
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.CATEGORY_EN, c.CATEGORY_KH
       FROM TBL_PRODUCTS p
       LEFT JOIN TBL_CATEGORY c ON c.ID = p.CATEGORY_ID
       WHERE p.ID = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Product not found" });
  res.json(row);
});

// POST /api/products - create a new product
router.post("/", (req, res) => {
  const {
    PRODUCT_ID, SUPPLIER_ID, BARCODE, NAME_EN, NAME_KH, BRAND, MODEL,
    CATEGORY_ID, BUYIN_PRICE, SALEOUT_PRICE, QTY_INSTOCK, QTY_ALERT, STATUS,
  } = req.body;

  if (!NAME_EN || SALEOUT_PRICE === undefined) {
    return res.status(400).json({ error: "NAME_EN and SALEOUT_PRICE are required" });
  }

  const info = db
    .prepare(
      `INSERT INTO TBL_PRODUCTS
        (PRODUCT_ID, SUPPLIER_ID, BARCODE, NAME_EN, NAME_KH, BRAND, MODEL,
         CATEGORY_ID, BUYIN_PRICE, SALEOUT_PRICE, QTY_INSTOCK, QTY_ALERT, STATUS, CREATED_DATE)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      PRODUCT_ID || null, SUPPLIER_ID || null, BARCODE || null, NAME_EN, NAME_KH || null,
      BRAND || null, MODEL || null, CATEGORY_ID || null, BUYIN_PRICE || 0,
      SALEOUT_PRICE, QTY_INSTOCK || 0, QTY_ALERT || 0, STATUS || "ACTIVE"
    );

  const created = db.prepare(`SELECT * FROM TBL_PRODUCTS WHERE ID = ?`).get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/products/:id - update a product
router.put("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM TBL_PRODUCTS WHERE ID = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const fields = [
    "NAME_EN", "NAME_KH", "BRAND", "MODEL", "CATEGORY_ID", "BUYIN_PRICE",
    "SALEOUT_PRICE", "QTY_INSTOCK", "QTY_ALERT", "STATUS",
  ];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: "No valid fields to update" });

  updates.push(`UPDATED_DATE = datetime('now')`);
  values.push(req.params.id);

  db.prepare(`UPDATE TBL_PRODUCTS SET ${updates.join(", ")} WHERE ID = ?`).run(...values);
  const updated = db.prepare(`SELECT * FROM TBL_PRODUCTS WHERE ID = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE /api/products/:id
router.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM TBL_PRODUCTS WHERE ID = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });
  db.prepare(`DELETE FROM TBL_PRODUCTS WHERE ID = ?`).run(req.params.id);
  res.status(204).end();
});

module.exports = router;
