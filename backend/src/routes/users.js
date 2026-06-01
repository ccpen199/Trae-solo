const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('manager'), (req, res) => {
  const { role } = req.query;
  
  let sql = 'SELECT id, username, name, role, phone, created_at FROM users';
  const params = [];
  
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const users = db.prepare(sql).all(...params);
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, phone, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

router.post('/', requireRole('manager'), (req, res) => {
  const { username, password, name, role, phone } = req.body;
  
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const result = db.prepare(`
    INSERT INTO users (username, password, name, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `).run(username, hashedPassword, name, role, phone || '');

  const user = db.prepare('SELECT id, username, name, role, phone, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.put('/:id', requireRole('manager'), (req, res) => {
  const { name, role, phone, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let hashedPassword = user.password;
  if (password) {
    hashedPassword = bcrypt.hashSync(password, 10);
  }

  db.prepare(`
    UPDATE users SET name = ?, role = ?, phone = ?, password = ?
    WHERE id = ?
  `).run(name || user.name, role || user.role, phone !== undefined ? phone : user.phone, hashedPassword, req.params.id);

  const updated = db.prepare('SELECT id, username, name, role, phone, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireRole('manager'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (user.username === 'admin' || user.username === 'manager') {
    return res.status(400).json({ error: '不能删除系统管理员' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
