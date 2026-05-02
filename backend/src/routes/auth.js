const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'knowledge-base-secret-key-2024',
    { expiresIn: '24h' }
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, details)
    VALUES (?, ?, 'login', 'auth', ?)
  `).run(user.id, user.name, JSON.stringify({ loginTime: new Date().toISOString() }));

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      email: user.email
    }
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  const user = req.user;
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, details)
    VALUES (?, ?, 'logout', 'auth', ?)
  `).run(user.id, user.name, JSON.stringify({ logoutTime: new Date().toISOString() }));

  res.json({ message: '登出成功' });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    department: user.department,
    email: user.email
  });
});

module.exports = router;
