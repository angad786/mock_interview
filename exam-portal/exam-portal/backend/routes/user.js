const express = require("express");
const db = require("../db/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/user/me - returns the logged-in user's profile
router.get("/me", authenticateToken, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const { passwordHash, ...safeUser } = user;
  return res.status(200).json({ success: true, user: safeUser });
});

module.exports = router;
