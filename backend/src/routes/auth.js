const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { JWT_SECRET, logOperation } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !user.is_active) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const isValid = bcrypt.compareSync(password, user.password_hash);
  
  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  logOperation(req, 'login', 'user', user.id, { username: user.username });
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, email, display_name } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  const password_hash = bcrypt.hashSync(password, 10);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, email, display_name, role)
    VALUES (?, ?, ?, ?, 'user')
  `);
  
  const result = stmt.run(username, password_hash, email || null, display_name || username);
  
  logOperation(req, 'register', 'user', result.lastInsertRowid, { username });
  
  res.json({ id: result.lastInsertRowid, username, message: '注册成功' });
});

router.post('/logout', (req, res) => {
  logOperation(req, 'logout', 'user', null, {});
  res.json({ message: '登出成功' });
});

module.exports = router;
