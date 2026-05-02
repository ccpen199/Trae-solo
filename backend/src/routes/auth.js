const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { ROLE_LABELS } = require('../utils');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: '登录成功',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleLabel: ROLE_LABELS[user.role],
      email: user.email,
      department: user.department
    }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const unreadCount = db.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id);

  res.json({
    ...req.user,
    roleLabel: ROLE_LABELS[req.user.role],
    unreadCount: unreadCount.count
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: '退出成功' });
});

module.exports = router;
