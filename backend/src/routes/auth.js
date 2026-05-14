
const express = require('express');
const router = express.Router();
const db = require('../models/database');

router.post('/check-phone', function(req, res) {
  const phone = req.body.phone;
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  res.json({ registered: user != null, phone: phone });
});

router.post('/send-code', function(req, res) {
  const phone = req.body.phone;
  const code = Math.random().toString().slice(2, 8);
  const expiresAt = new Date(Date.now() + 300000).toISOString();
  
  db.prepare('INSERT OR REPLACE INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)').run(phone, code, expiresAt);
  
  console.log('Verification code for', phone, ':', code);
  res.json({ success: true, message: 'Code sent' });
});

router.post('/verify-code', function(req, res) {
  const phone = req.body.phone;
  const code = req.body.code;
  const record = db.prepare('SELECT * FROM verification_codes WHERE phone = ? AND code = ?').get(phone, code);
  
  if (!record) {
    return res.status(400).json({ success: false, message: 'Invalid code' });
  }
  
  const now = new Date();
  const exp = new Date(record.expires_at);
  if (exp.getTime() < now.getTime()) {
    return res.status(400).json({ success: false, message: 'Code expired' });
  }
  
  res.json({ success: true });
});

router.post('/register', function(req, res) {
  const phone = req.body.phone;
  const password = req.body.password;
  const result = db.prepare('INSERT INTO users (phone, password) VALUES (?, ?)').run(phone, password);
  res.json({ success: true, userId: result.lastInsertRowid });
});

router.post('/login', function(req, res) {
  const phone = req.body.phone;
  const password = req.body.password;
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  
  if (!user || user.password !== password) {
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
  
  res.json({ success: true, userId: user.id, phone: user.phone });
});

module.exports = router;
