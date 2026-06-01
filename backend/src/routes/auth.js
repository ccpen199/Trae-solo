const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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
    { userId: user.id },
    process.env.JWT_SECRET || 'afterschool_secret_key_2024',
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.role, u.name, u.phone, u.email, u.grade_id, u.parent_id,
           g.name as grade_name
    FROM users u
    LEFT JOIN grades g ON u.grade_id = g.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (user.role === 'parent') {
    user.children = db.prepare(`
      SELECT id, name, grade_id, (SELECT name FROM grades WHERE id = grade_id) as grade_name
      FROM users
      WHERE parent_id = ?
    `).all(user.id);
  }

  res.json(user);
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: '登出成功' });
});

module.exports = router;
