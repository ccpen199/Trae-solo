const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)').run(username, hashedPassword, nickname || username);

  const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const user = db.prepare('SELECT id, username, nickname, level, coins, reputation FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userInfo } = user;

  res.json({ token, user: userInfo });
});

router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
