const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'evidence-catalog-secret-key-2024';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, 'login', 'auth', '用户登录', req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    }
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'logout', 'auth', '用户登出', req.ip);

  res.json({ message: '登出成功' });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
