const express = require('express');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/schema');
const { verifyPassword, hashPassword } = require('../utils/encryption');
const { authenticateToken, logAction } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: '账户已被禁用' });
  }

  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  logAction({ user, ip: req.ip, headers: req.headers }, 'login', 'user', user.id);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  logAction(req, 'logout', 'user', req.user.id);
  res.json({ message: '已登出成功' });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

router.get('/users', authenticateToken, (req, res) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT id, username, email, role, department, status, created_at
    FROM users
    ORDER BY username
  `).all();
  res.json({ users });
});

module.exports = router;
