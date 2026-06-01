const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      student_id: user.student_id
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, student_id, phone, email } = req.body;
  
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const result = db.prepare(`
    INSERT INTO users (username, password, name, role, student_id, phone, email)
    VALUES (?, ?, ?, 'student', ?, ?, ?)
  `).run(username, hashedPassword, name, student_id, phone, email);

  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      name,
      role: 'student',
      student_id
    }
  });
});

module.exports = router;
