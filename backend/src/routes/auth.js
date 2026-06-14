
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

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);

  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'headhunter_platform_secret_key_2024',
    { expiresIn: '7d' }
  );

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, ip, details)
    VALUES (?, 'login', 'user', ?, ?)
  `).run(user.id, req.ip, JSON.stringify({ userAgent: req.headers['user-agent'] }));

  const company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      credit_score: user.credit_score,
      exposure_weight: user.exposure_weight,
      total_recommendations: user.total_recommendations,
      success_hires: user.success_hires,
      total_commission: user.total_commission,
      company: company || null
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, real_name, phone, email, role } = req.body;

  if (!username || !password || !real_name || !role) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  if (!['user', 'company'].includes(role)) {
    return res.status(400).json({ error: '无效的用户角色' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(`
    INSERT INTO users (username, password, real_name, phone, email, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(username, hashedPassword, real_name, phone, email, role);

  const token = jwt.sign(
    { userId: info.lastInsertRowid, username, role },
    process.env.JWT_SECRET || 'headhunter_platform_secret_key_2024',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: info.lastInsertRowid,
      username,
      real_name,
      phone,
      email,
      role,
      credit_score: 100
    }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT id, username, real_name, phone, email, role, avatar,
           credit_score, exposure_weight, total_recommendations,
           success_hires, total_commission, created_at
    FROM users WHERE id = ?
  `).get(req.user.id);

  const company = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.user.id);

  res.json({ ...user, company: company || null });
});

router.post('/logout', authenticateToken, (req, res) => {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, ip, details)
    VALUES (?, 'logout', 'user', ?, ?)
  `).run(req.user.id, req.ip, JSON.stringify({ userAgent: req.headers['user-agent'] }));

  res.json({ message: '登出成功' });
});

module.exports = router;
