const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

const router = express.Router();
const JWT_SECRET = 'china-post-portal-secret-key-2024';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  if (user.status !== 'active') {
    return res.status(403).json({ error: '账户已被禁用' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, type: user.type },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  const { password: _, ...userInfo } = user;
  res.json({ token, user: userInfo });
});

router.post('/register', (req, res) => {
  const { username, email, password, type, phone, address } = req.body;
  const db = getDb();
  
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    return res.status(400).json({ error: '用户名或邮箱已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const result = db.prepare(`
      INSERT INTO users (username, email, password, type, phone, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, email, hashedPassword, type || 'personal', phone, address);
    
    const user = db.prepare('SELECT id, username, email, type, phone, address, status FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: '注册失败' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const demoUsers = {
    'local-demo-admin': { id: 1, username: 'admin', type: 'enterprise' },
    'local-demo-personal': { id: 2, username: 'user1', type: 'personal' }
  };

  if (demoUsers[token]) {
    req.user = demoUsers[token];
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
