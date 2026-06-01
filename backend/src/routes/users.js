const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../models/database');
const { authMiddleware, createAuditLog } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { role, page = 1, page_size = 50 } = req.query;
  let query = 'SELECT id, username, role, name, email, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) { query += ' AND role = ?'; params.push(role); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const users = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM users WHERE 1=1').get().count;

  res.json({ data: users, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, role, name, email, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

module.exports = router;
