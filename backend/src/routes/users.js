const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/profile', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, type, phone, address, status, created_at FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  res.json(user);
});

router.put('/profile', authenticateToken, (req, res) => {
  const { phone, address } = req.body;
  const db = getDb();
  
  db.prepare(`
    UPDATE users SET phone = ?, address = ? WHERE id = ?
  `).run(phone, address, req.user.id);
  
  const user = db.prepare('SELECT id, username, email, type, phone, address, status FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
