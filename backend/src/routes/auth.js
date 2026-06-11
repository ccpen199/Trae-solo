const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password, nickname } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db.prepare(`
    INSERT INTO users (username, email, password_hash, nickname, n_coins)
    VALUES (?, ?, ?, ?, 100)
  `).run(username, email, passwordHash, nickname || username);

  const userId = result.lastInsertRowid;
  const token = generateToken(userId);

  db.prepare('INSERT INTO ncoin_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)')
    .run(userId, 100, 'bonus', '注册奖励');

  const user = db.prepare('SELECT id, username, email, nickname, avatar, n_coins, role FROM users WHERE id = ?').get(userId);

  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken(user.id);

  db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    n_coins: user.n_coins,
    role: user.role
  };

  res.json({ token, user: safeUser });
});

router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, email, nickname, avatar, phone, n_coins, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { nickname, avatar, phone } = req.body;
  
  db.prepare('UPDATE users SET nickname = ?, avatar = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(nickname || req.user.nickname, avatar || req.user.avatar, phone || null, req.user.id);

  const user = db.prepare('SELECT id, username, email, nickname, avatar, phone, n_coins, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router;
