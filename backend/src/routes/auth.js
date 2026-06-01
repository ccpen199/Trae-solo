const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'sdk-admin-secret-key-2024',
    { expiresIn: '24h' }
  );
  
  db.prepare(`
    INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(`audit-login-${Date.now()}`, user.id, 'login', 'user', user.id, req.ip);
  
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

router.post('/logout', (req, res) => {
  res.json({ message: '登出成功' });
});

module.exports = router;
