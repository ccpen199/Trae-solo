const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  
  db.prepare(`
    INSERT INTO operation_logs (user_id, action, details)
    VALUES (?, 'login', ?)
  `).run(user.id, JSON.stringify({ ip: req.ip }));
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      level: user.level,
      credit_score: user.credit_score
    }
  });
});

router.post('/logout', authenticate, (req, res) => {
  db.prepare(`
    INSERT INTO operation_logs (user_id, action)
    VALUES (?, 'logout')
  `).run(req.user.id);
  res.json({ message: '退出成功' });
});

router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

module.exports = router;
