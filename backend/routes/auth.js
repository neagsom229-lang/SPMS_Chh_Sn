// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
// NOTE: Tbl_Users stores plaintext passwords, carried over as-is from the
// Access database. That's fine for a coursework/local project, but if this
// were ever deployed for real, passwords should be hashed (e.g. with bcrypt)
// before being stored or compared.
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = db
    .prepare(
      `SELECT UserID, Username, Password, FullName, Role, Status
       FROM Tbl_Users WHERE Username = ?`
    )
    .get(username);

  if (!user || user.Password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  if (user.Status !== "ACTIVE") {
    return res.status(403).json({ error: "This account is not active" });
  }

  const token = jwt.sign(
    { userId: user.UserID, username: user.Username, role: user.Role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: {
      id: user.UserID,
      username: user.Username,
      fullName: user.FullName,
      role: user.Role,
    },
  });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
