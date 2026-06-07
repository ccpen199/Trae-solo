const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../models/database');
const { SECRET_KEY, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, type: user.type, name: user.name },
    SECRET_KEY,
    { expiresIn: '24h' }
  );

  const { password: _, ...userInfo } = user;
  res.json({ token, user: userInfo });
});

router.post('/register', (req, res) => {
  const { username, password, name, idCard, phone, type = 'personal' } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR id_card = ?').get(username, idCard);
  
  if (existing) {
    return res.status(400).json({ error: '用户名或身份证号已存在' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const result = db.prepare(`
    INSERT INTO users (username, password, name, id_card, phone, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(username, hashedPassword, name, idCard, phone, type);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username, type, name },
    SECRET_KEY,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: result.lastInsertRowid, username, name, type } });
});

router.get('/profile', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, name, id_card, phone, email, type, avatar, address, created_at FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
});

module.exports = router;
