const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth } = require('../middleware/auth');

router.post('/register', (req, res) => {
  try {
    const { username, password, role, phone } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ code: -1, message: 'Missing required fields' });
    }
    if (!['worker', 'employer'].includes(role)) {
      return res.status(400).json({ code: -1, message: 'Invalid role' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ code: -1, message: 'Username already exists' });
    }
    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, ?, ?)'
    ).run(username, password_hash, role, phone || null);

    if (role === 'worker') {
      db.prepare('INSERT INTO worker_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);
    } else if (role === 'employer') {
      db.prepare('INSERT INTO employer_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);
    }

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      code: 0,
      data: { token, user: { id: result.lastInsertRowid, username, role, phone: phone || null } },
      message: 'Registration successful'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: -1, message: 'Missing username or password' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ code: -1, message: 'User not found' });
    }
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ code: -1, message: 'Invalid password' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      code: 0,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role, phone: user.phone, avatar: user.avatar }
      },
      message: 'Login successful'
    });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

router.get('/me', auth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, role, phone, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ code: -1, message: 'User not found' });
    }
    let profile = null;
    if (user.role === 'worker') {
      profile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'employer') {
      profile = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(user.id);
    }
    res.json({ code: 0, data: { ...user, profile }, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

module.exports = router;
