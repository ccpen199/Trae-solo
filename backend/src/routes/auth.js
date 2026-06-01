const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { validatePhone, validateIdCard } = require('../utils/validators');

router.post('/register', (req, res) => {
  const { username, phone, password, real_name, id_card, region_code, role } = req.body;
  if (!username || !phone || !password || !region_code) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }
  if (id_card && !validateIdCard(id_card)) {
    return res.status(400).json({ error: '身份证号格式不正确' });
  }
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?').get(username, phone);
  if (existingUser) {
    return res.status(400).json({ error: '用户名或手机号已存在' });
  }
  const region = db.prepare('SELECT code, name FROM admin_regions WHERE code = ?').get(region_code);
  if (!region) {
    return res.status(400).json({ error: '行政区划代码不存在' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const userRole = role || 'resident';
  const validRoles = ['resident', 'individual_employer', 'enterprise_employer'];
  if (!validRoles.includes(userRole)) {
    return res.status(400).json({ error: '用户角色无效' });
  }
  const result = db.prepare(`
    INSERT INTO users (username, phone, password_hash, real_name, id_card, region_code, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(username, phone, password_hash, real_name, id_card, region_code, userRole);
  const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const user = db.prepare('SELECT id, username, phone, real_name, region_code, role, status FROM users WHERE id = ?').get(result.lastInsertRowid);
  db.prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    result.lastInsertRowid, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  res.json({ message: '注册成功', token, user, region });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (user.status !== 1) {
    return res.status(401).json({ error: '账号已被禁用' });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const region = db.prepare('SELECT code, name, poi_density FROM admin_regions WHERE code = ?').get(user.region_code);
  db.prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    user.id, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  const userInfo = {
    id: user.id,
    username: user.username,
    phone: user.phone,
    real_name: user.real_name,
    region_code: user.region_code,
    role: user.role,
    status: user.status
  };
  res.json({ message: '登录成功', token, user: userInfo, region });
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (!bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (admin.status !== 1) {
    return res.status(401).json({ error: '账号已被禁用' });
  }
  const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  const adminInfo = {
    id: admin.id,
    username: admin.username,
    real_name: admin.real_name,
    role: admin.role,
    region_code: admin.region_code,
    level: admin.level
  };
  res.json({ message: '登录成功', token, admin: adminInfo });
});

router.get('/profile', authenticateUser, (req, res) => {
  const region = db.prepare('SELECT code, name, poi_density FROM admin_regions WHERE code = ?').get(req.user.region_code);
  res.json({ user: req.user, region });
});

router.post('/logout', authenticateUser, (req, res) => {
  const token = req.headers.authorization.substring(7);
  db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
  res.json({ message: '登出成功' });
});

module.exports = router;
