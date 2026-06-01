const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware(['admin', 'operator']), (req, res) => {
  const db = req.app.get('db');
  const { role, status, keyword, page = 1, pageSize = 20 } = req.query;

  let sql = 'SELECT id, username, nickname, role, balance, avatar, status, created_at FROM users WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const params = [];

  if (role) {
    sql += ' AND role = ?';
    countSql += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    sql += ' AND status = ?';
    countSql += ' AND status = ?';
    params.push(status);
  }
  if (keyword) {
    sql += ' AND (username LIKE ? OR nickname LIKE ?)';
    countSql += ' AND (username LIKE ? OR nickname LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, Number(pageSize), (Number(page) - 1) * Number(pageSize)];

  const users = db.prepare(sql).all(...queryParams);
  const { total } = db.prepare(countSql).get(...params);

  res.json({ items: users, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/', authMiddleware(['admin']), (req, res) => {
  const db = req.app.get('db');
  const { username, password, nickname, role } = req.body;

  const exists = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (exists) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hash = bcrypt.hashSync(password || '123456', 10);
  const result = db.prepare(`
    INSERT INTO users (username, password, nickname, role)
    VALUES (?, ?, ?, ?)
  `).run(username, hash, nickname, role || 'user');

  res.json({ id: result.lastInsertRowid, success: true });
});

router.put('/:id', authMiddleware(['admin']), (req, res) => {
  const db = req.app.get('db');
  const { nickname, role, status, balance } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  db.prepare(`
    UPDATE users 
    SET nickname = ?, role = ?, status = ?, balance = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nickname, role, status, balance, req.params.id);

  res.json({ success: true });
});

router.patch('/:id/balance', authMiddleware(['admin', 'finance']), (req, res) => {
  const db = req.app.get('db');
  const { amount, reason } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(amount, req.params.id);
    db.prepare(`
      INSERT INTO balance_records (user_id, amount, type, remark, balance_after)
      VALUES (?, ?, ?, ?, (SELECT balance FROM users WHERE id = ?))
    `).run(req.params.id, amount, 'admin_adjust', reason || '管理员调整', req.params.id);
  });

  tx();
  res.json({ success: true });
});

module.exports = router;
