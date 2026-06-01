const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = req.db;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, nickname: user.nickname },
    process.env.JWT_SECRET || 'novel-platform-secret-key-2024',
    { expiresIn: '7d' }
  );
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      phone: user.phone,
      email: user.email,
      balance: user.balance
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, nickname, role = 'reader', phone } = req.body;
  const db = req.db;
  
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password, nickname, role, phone) VALUES (?, ?, ?, ?, ?)'
  ).run(username, hash, nickname || username, role, phone);
  
  const token = jwt.sign(
    { id: result.lastInsertRowid, username, role, nickname: nickname || username },
    process.env.JWT_SECRET || 'novel-platform-secret-key-2024',
    { expiresIn: '7d' }
  );
  
  res.json({
    token,
    user: { id: result.lastInsertRowid, username, nickname: nickname || username, role, balance: 0 }
  });
});

router.get('/profile', require('../middleware/auth').authMiddleware, (req, res) => {
  const db = req.db;
  const user = db.prepare('SELECT id, username, nickname, avatar, role, phone, email, balance, status, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
