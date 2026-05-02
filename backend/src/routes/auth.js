const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { getUserTodoCount } = require('../utils/sessionUtils');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: '用户已被禁用' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const todoCount = getUserTodoCount(user.id, user.role);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email
    },
    todoCount
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, role, phone, email } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: '用户名、密码和姓名为必填项' });
  }

  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const userId = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userRole = role || 'buyer';

  db.prepare(`
    INSERT INTO users (id, username, password, name, role, phone, email, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(userId, username, hashedPassword, name, userRole, phone, email);

  const token = jwt.sign(
    { id: userId, username: username, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const todoCount = getUserTodoCount(userId, userRole);

  res.status(201).json({
    token,
    user: {
      id: userId,
      username: username,
      name: name,
      role: userRole,
      phone: phone,
      email: email
    },
    todoCount
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const todoCount = getUserTodoCount(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email
      },
      todoCount
    });
  });
});

module.exports = router;
