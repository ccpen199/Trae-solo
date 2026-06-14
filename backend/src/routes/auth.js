const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateUserToken, generateAdminToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { phone, password, real_name, id_card, user_type } = req.body;
  
  if (!phone || !password) {
    return res.error('手机号和密码不能为空', 400);
  }
  
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.error('手机号格式不正确', 400);
  }
  
  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existingUser) {
    return res.error('该手机号已注册', 400);
  }
  
  const hash = bcrypt.hashSync(password, 10);
  
  const result = db.prepare(`
    INSERT INTO users (phone, password, real_name, id_card, user_type)
    VALUES (?, ?, ?, ?, ?)
  `).run(phone, hash, real_name || '', id_card || '', user_type || 'normal');
  
  const userId = result.lastInsertRowid;
  
  db.prepare('INSERT INTO user_points (user_id, points, level, total_points) VALUES (?, 0, 1, 0)').run(userId);
  
  const cardNo = 'TF' + Date.now().toString().slice(-10);
  db.prepare(`
    INSERT INTO tianfutong_cards (user_id, card_no, card_type, region)
    VALUES (?, ?, 'normal', '成都市')
  `).run(userId, cardNo);
  
  const token = generateUserToken(userId);
  
  const user = db.prepare('SELECT id, phone, real_name, user_type FROM users WHERE id = ?').get(userId);
  const card = db.prepare('SELECT id, card_no, card_type, balance, times_count, card_status FROM tianfutong_cards WHERE user_id = ?').get(userId);
  
  res.success({ token, user, card }, '注册成功');
});

router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.error('手机号和密码不能为空', 400);
  }
  
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  
  if (!user) {
    return res.error('用户不存在', 404);
  }
  
  if (user.status !== 1) {
    return res.error('账号已被禁用', 403);
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.error('密码错误', 401);
  }
  
  const token = generateUserToken(user.id);
  const card = db.prepare('SELECT id, card_no, card_type, balance, times_count, card_status, nfc_enabled FROM tianfutong_cards WHERE user_id = ?').get(user.id);
  const points = db.prepare('SELECT points, level, total_points FROM user_points WHERE user_id = ?').get(user.id);
  
  delete user.password;
  
  res.success({ token, user, card, points }, '登录成功');
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.error('用户名和密码不能为空', 400);
  }
  
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  
  if (!admin) {
    return res.error('管理员不存在', 404);
  }
  
  if (admin.status !== 1) {
    return res.error('账号已被禁用', 403);
  }
  
  if (!bcrypt.compareSync(password, admin.password)) {
    return res.error('密码错误', 401);
  }
  
  const token = generateAdminToken(admin.id);
  
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, ip_address) VALUES (?, ?, ?, ?, ?)')
    .run(admin.id, 'admin_login', 'admin', admin.id, req.ip);
  
  delete admin.password;
  
  res.success({ token, admin }, '登录成功');
});

router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, phone, real_name, id_card, user_type, avatar, address, created_at FROM users WHERE id = ?').get(req.user.id);
  const cards = db.prepare('SELECT * FROM tianfutong_cards WHERE user_id = ?').all(req.user.id);
  const points = db.prepare('SELECT points, level, total_points FROM user_points WHERE user_id = ?').get(req.user.id);
  const channels = db.prepare('SELECT id, channel_type, channel_name, is_default FROM payment_channels WHERE user_id = ?').all(req.user.id);
  
  res.success({ user, cards, points, channels }, '获取成功');
});

router.put('/profile', authenticateToken, (req, res) => {
  const { real_name, avatar, address } = req.body;
  
  db.prepare(`
    UPDATE users SET real_name = ?, avatar = ?, address = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(real_name || req.user.real_name, avatar || '', address || '', req.user.id);
  
  res.success(null, '更新成功');
});

module.exports = router;
