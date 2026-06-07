const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { logAction } = require('../middleware/audit');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '24h' }
  );

  logAction('user_login', req, 'user', user.id, `用户 ${username} 登录成功`);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    },
  });
});

router.post('/register', (req, res) => {
  const { username, password, role, email, phone, name } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO users (username, password, role, email, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, hashedPassword, role, email, phone);

    if (role === 'jobseeker') {
      db.prepare(`
        INSERT INTO job_seekers (user_id, name, phone, email)
        VALUES (?, ?, ?, ?)
      `).run(info.lastInsertRowid, name || username, phone, email);
    } else if (role === 'hr') {
      db.prepare(`
        INSERT INTO enterprises (user_id, enterprise_name, contact_person, contact_phone)
        VALUES (?, ?, ?, ?)
      `).run(info.lastInsertRowid, name || username, name || username, phone);
    }

    return info.lastInsertRowid;
  });

  try {
    const userId = tx();
    logAction('user_register', req, 'user', userId, `用户 ${username} 注册成功，角色：${role}`);
    res.json({ success: true, userId });
  } catch (e) {
    res.status(500).json({ error: '注册失败: ' + e.message });
  }
});

router.get('/me', authenticateJWT, (req, res) => {
  let profile = null;
  
  if (req.user.role === 'jobseeker') {
    profile = db.prepare('SELECT * FROM job_seekers WHERE user_id = ?').get(req.user.id);
  } else if (req.user.role === 'hr') {
    profile = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(req.user.id);
  }

  res.json({
    user: req.user,
    profile,
  });
});

router.post('/logout', authenticateJWT, (req, res) => {
  logAction('user_logout', req, 'user', req.user.id, `用户 ${req.user.username} 退出登录`);
  res.json({ success: true });
});

module.exports = router;
