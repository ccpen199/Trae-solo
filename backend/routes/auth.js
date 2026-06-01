const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { validateFields } = require('../middleware');

const router = express.Router();

router.post('/login', validateFields(['username', 'password']), (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'db-migration-tool-secret-2024',
    { expiresIn: '24h' }
  );

  db.prepare('INSERT INTO operation_logs (user_id, operation, module, ip_address) VALUES (?, ?, ?, ?)')
    .run(user.id, 'login', 'auth', req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    }
  });
});

router.get('/profile', (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = router;
