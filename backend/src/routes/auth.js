const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const registerSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  password: Joi.string().min(6).required(),
  nickname: Joi.string().max(50),
  role: Joi.string().valid('user', 'provider', 'agent').default('user'),
  real_name: Joi.string().allow(''),
  id_card: Joi.string().allow('')
});

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  password: Joi.string().required()
});

router.post('/register', (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { phone, password, nickname, role = 'user', real_name, id_card } = value;

  if (role === 'provider' && (!real_name || !id_card)) {
    return res.status(400).json({ error: '服务提供者必须完成实名认证' });
  }

  if (role === 'agent') {
    const whitelistEntry = db.prepare('SELECT * FROM whitelist WHERE phone = ?').get(phone);
    if (!whitelistEntry) {
      return res.status(400).json({ error: '该手机号不在城市运营白名单中，请联系管理员申请准入' });
    }
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existingUser) {
    return res.status(400).json({ error: '该手机号已注册，请直接登录' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const isVerified = (real_name && id_card) ? 1 : 0;
  
  const result = db.prepare('INSERT INTO users (phone, password_hash, nickname, role, real_name, id_card, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    phone, passwordHash, nickname || `用户${phone.slice(-4)}`, role, real_name || null, id_card || null, isVerified
  );

  const token = jwt.sign(
    { userId: result.lastInsertRowid },
    process.env.JWT_SECRET || 'local-life-platform-secret-key-2024',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: result.lastInsertRowid,
      phone,
      nickname: nickname || `用户${phone.slice(-4)}`,
      role,
      is_verified: isVerified,
      credit_score: 100
    },
    message: role === 'agent' ? '注册成功，您已获得城市运营权限' : (isVerified ? '注册成功，已完成实名认证' : '注册成功')
  });
});

router.post('/login', (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { phone, password } = value;

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) {
    return res.status(400).json({ error: '手机号或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(400).json({ error: '手机号或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'local-life-platform-secret-key-2024',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      role: user.role,
      is_verified: user.is_verified,
      credit_score: user.credit_score
    }
  });
});

router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, phone, nickname, role, real_name, is_verified, avatar, credit_score, created_at FROM users WHERE id = ?').get(req.user.id);
  const certificates = db.prepare('SELECT * FROM certificates WHERE user_id = ?').all(req.user.id);
  res.json({ user, certificates });
});

router.post('/verify', authenticateToken, (req, res) => {
  const { real_name, id_card } = req.body;
  
  if (!real_name || !id_card) {
    return res.status(400).json({ error: '请提供真实姓名和身份证号' });
  }

  db.prepare('UPDATE users SET real_name = ?, id_card = ?, is_verified = 1 WHERE id = ?').run(
    real_name, id_card, req.user.id
  );

  const user = db.prepare('SELECT id, phone, nickname, real_name, is_verified, credit_score FROM users WHERE id = ?').get(req.user.id);
  res.json({ user, message: '实名认证提交成功' });
});

module.exports = router;
