const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: '权限不足' });
  }

  const users = db.prepare('SELECT id, username, name, role, email, phone, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

router.get('/all', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, username, name, role FROM users ORDER BY name').all();
  res.json({ users });
});

router.post('/', authenticateToken, requireRole('manager'), (req, res) => {
  const { username, password, name, role, email, phone } = req.body;

  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, name, role, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, hash, name, role, email, phone);

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, module, record_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'create', 'users', result.lastInsertRowid, `创建用户: ${name}`);

    res.json({ user: { id: result.lastInsertRowid, username, name, role, email, phone } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '用户名已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:userId', authenticateToken, (req, res) => {
  if (req.user.role !== 'manager' && req.user.id !== parseInt(req.params.userId)) {
    return res.status(403).json({ error: '权限不足' });
  }

  const { name, email, phone, role } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (role && req.user.role !== 'manager') {
    return res.status(403).json({ error: '只有管理员可以修改角色' });
  }

  db.prepare(`
    UPDATE users 
    SET name = ?, email = ?, phone = ?, role = COALESCE(?, role), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, email, phone, role || null, req.params.userId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'update', 'users', req.params.userId, `更新用户: ${name}`);

  res.json({ message: '用户更新成功' });
});

router.put('/:userId/password', authenticateToken, (req, res) => {
  if (req.user.role !== 'manager' && req.user.id !== parseInt(req.params.userId)) {
    return res.status(403).json({ error: '权限不足' });
  }

  const { password } = req.body;
  const hash = bcrypt.hashSync(password, 10);

  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.params.userId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'password', 'users', req.params.userId, '修改密码');

  res.json({ message: '密码修改成功' });
});

module.exports = router;
