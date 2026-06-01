const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user);

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

router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, 'approval-form-platform-secret-key-2024');
    const user = db.prepare('SELECT id, username, name, role, email FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: '无效的令牌' });
  }
});

module.exports = router;
