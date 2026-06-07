const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', (req, res) => {
  try {
    const { userId } = req.query;
    const user = userId
      ? db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      : db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get() || db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', (req, res) => {
  try {
    const { username, password, role, name, phone, email } = req.body;
    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: 'username, password, role, and name are required' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'username already exists' });
    }
    const result = db.prepare('INSERT INTO users (username, password, role, name, phone, email) VALUES (?, ?, ?, ?, ?, ?)').run(username, password, role, name, phone || null, email || null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
