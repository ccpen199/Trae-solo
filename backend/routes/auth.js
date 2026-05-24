const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }
  
  const isValid = bcrypt.compareSync(password, user.password);
  
  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, store_id: user.store_id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  const { password: _, ...userInfo } = user;
  
  res.json({
    token,
    user: userInfo,
    expiresIn: 86400
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, phone, email, role } = req.body;
  
  if (!username || !password || !name) {
    return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
  }
  
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userRole = role || 'owner';
  
  const info = db.prepare(`
    INSERT INTO users (username, password, role, name, phone, email, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(username, hashedPassword, userRole, name, phone, email);
  
  const user = db.prepare('SELECT id, username, role, name, phone, email, store_id, status, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, store_id: user.store_id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user,
    expiresIn: 86400
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, role, name, phone, email, store_id, avatar, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: '已退出登录' });
});

module.exports = router;
