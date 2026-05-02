const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    user.id,
    'LOGIN',
    'USER',
    user.id,
    JSON.stringify({ username: user.username })
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, email, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(409).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();
  const userRole = role || 'developer';

  db.prepare(`
    INSERT INTO users (id, username, password, email, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, username, hashedPassword, email, userRole);

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    userId,
    'REGISTER',
    'USER',
    userId,
    JSON.stringify({ username, role: userRole })
  );

  res.status(201).json({
    message: '注册成功',
    user: {
      id: userId,
      username,
      email,
      role: userRole
    }
  });
});

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '需要认证' });
  }

  const todoCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM messages 
    WHERE recipient_id = ? AND is_read = 0 AND type = 'todo'
  `).get(req.user.id);

  res.json({
    ...req.user,
    todo_count: todoCount.count
  });
});

module.exports = router;
