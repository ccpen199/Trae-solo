const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password, role, phone } = req.body;
  
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['jobseeker', 'hr'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const fingerprint = req.headers['x-device-fingerprint'] || null;

  const result = db.prepare(`
    INSERT INTO users (username, email, password, role, phone, device_fingerprint)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(username, email, hashedPassword, role, phone || null, fingerprint);

  const userId = result.lastInsertRowid;

  if (role === 'jobseeker') {
    db.prepare('INSERT INTO jobseekers (user_id) VALUES (?)').run(userId);
  }

  const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: { id: userId, username, email, role, phone }
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.status === 'frozen') {
    return res.status(403).json({ error: 'Account has been frozen' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const fingerprint = req.headers['x-device-fingerprint'];
  if (fingerprint && user.device_fingerprint && user.device_fingerprint !== fingerprint) {
    console.warn(`User ${username} logged in from new device`);
  }

  db.prepare('UPDATE users SET device_fingerprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(fingerprint || user.device_fingerprint, user.id);

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const { id, username, email, role, phone, avatar, status } = req.user;
  
  let profile = null;
  if (role === 'jobseeker') {
    profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(id);
  } else if (role === 'hr') {
    profile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(id);
  }

  res.json({
    user: { id, username, email, role, phone, avatar, status, profile }
  });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { avatar, phone } = req.body;
  const userId = req.user.id;

  db.prepare(`
    UPDATE users SET avatar = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(avatar || req.user.avatar, phone || req.user.phone, userId);

  res.json({ message: 'Profile updated successfully' });
});

module.exports = router;
