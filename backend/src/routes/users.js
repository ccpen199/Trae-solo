const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare(`
    SELECT id, username, name, role, phone FROM users
    WHERE username = ? AND password = ?
  `).get(username, password);
  
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, phone, created_at FROM users').all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { username, password, name, role, phone } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, name, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, password, name, role, phone);
    
    res.json({ id: result.lastInsertRowid, message: '用户创建成功' });
  } catch (err) {
    res.status(400).json({ error: '用户名已存在' });
  }
});

module.exports = router;
