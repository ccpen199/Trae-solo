const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

router.post('/login', (req, res) => {
  const { phone, password } = req.body;

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user) {
    const hashedPassword = bcrypt.hashSync(password || '123456', 10);
    const userId = db.prepare('INSERT INTO users (phone, username, password) VALUES (?, ?, ?)').run(phone, `用户${phone.slice(-4)}`, hashedPassword).lastInsertRowid;
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } else if (password && !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '密码错误' });
  }

  const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      username: user.username,
      avatar: user.avatar,
      is_vip: user.is_vip
    }
  });
});

router.get('/profile', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ isLoggedIn: false });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.json({ isLoggedIn: false });
    }
    
    const user = db.prepare('SELECT id, phone, username, avatar, is_vip FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.json({ isLoggedIn: false });
    }
    
    res.json({ isLoggedIn: true, user });
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true });
});

module.exports = router;
