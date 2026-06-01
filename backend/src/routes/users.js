const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await db.all('SELECT id, username, name, role, email, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/current', authenticateToken, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
