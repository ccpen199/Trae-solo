const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/list', authMiddleware, roleMiddleware('admin', 'editor'), (req, res) => {
  const db = req.db;
  const { role, page = 1, pageSize = 20 } = req.query;
  
  let where = '';
  let params = [];
  if (role) {
    where = 'WHERE role = ?';
    params.push(role);
  }
  
  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);
  
  const users = db.prepare(`
    SELECT id, username, nickname, avatar, role, phone, email, status, created_at
    FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(...params);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params.slice(0, -2)).count;
  
  res.json({ list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.put('/:id/status', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const db = req.db;
  const { status } = req.body;
  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ message: '状态更新成功' });
});

router.get('/balance', authMiddleware, (req, res) => {
  const db = req.db;
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.balance });
});

router.post('/recharge', authMiddleware, (req, res) => {
  const db = req.db;
  const { amount } = req.body;
  db.prepare('UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(amount, req.user.id);
  res.json({ message: '充值成功' });
});

module.exports = router;
