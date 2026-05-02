const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginValidation } = require('../middleware/validation');
const { UserRole } = require('../config/enums');
const AuditService = require('../services/audit.service');

const JWT_SECRET = process.env.JWT_SECRET || 'pv-ops-system-secret-key-2024';

router.post('/login', loginValidation, (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: '数据库未就绪' });
    }

    const { username, password } = req.body;

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    stmt.free();
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: '用户已被禁用' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    AuditService.log(req, 'login', 'auth', 'user', user.id);

    res.json({
      message: '登录成功',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', (req, res) => {
  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: '数据库未就绪' });
  }

  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }

  const stmt = db.prepare('SELECT id, username, name, phone, email, role, status FROM users WHERE id = ?');
  const user = stmt.get(req.user.id);
  stmt.free();
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
});

router.put('/me', (req, res) => {
  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: '数据库未就绪' });
  }

  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }

  const { name, phone, email } = req.body;
  
  const oldStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const oldUser = oldStmt.get(req.user.id);
  oldStmt.free();

  const updateStmt = db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      updated_at = datetime('now')
    WHERE id = ?
  `);
  updateStmt.run(name, phone, email, req.user.id);
  updateStmt.free();

  const getStmt = db.prepare('SELECT id, username, name, phone, email, role, status FROM users WHERE id = ?');
  const updatedUser = getStmt.get(req.user.id);
  getStmt.free();

  AuditService.logUpdate(req, 'auth', 'user', req.user.id, oldUser, updatedUser, '用户更新个人信息');

  res.json({ message: '更新成功', user: updatedUser });
});

router.post('/logout', (req, res) => {
  if (req.user) {
    AuditService.log(req, 'logout', 'auth', 'user', req.user.id);
  }
  res.json({ message: '登出成功' });
});

module.exports = router;
