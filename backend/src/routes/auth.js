const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(400).json({ error: '用户名或邮箱已被使用' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email, password_hash);

  const user = db.prepare('SELECT id, username, email, role, status FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ user, token });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请填写用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: '账号已被禁用' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...safeUser } = user;

  res.json({ user: safeUser, token });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { avatar } = req.body;
  const result = db.prepare(
    'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(avatar || null, req.user.id);
  
  const user = db.prepare('SELECT id, username, email, avatar, role, status FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router;
