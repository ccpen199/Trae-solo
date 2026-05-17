const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/privacy-policy', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      content: `
## 个人信息保护政策

### 一、如何收集和使用您的个人信息

1. 账号注册：我们会收集您的手机号/邮箱、用户名等信息，用于创建和管理您的账号。
2. 服务功能：为提供诗词摘录、创作社区等功能，我们会收集您的使用行为数据。

### 二、信息存储与保护

1. 我们采用业界标准的安全技术保护您的个人信息。
2. 数据存储于本地SQLite数据库，确保数据安全。

### 三、信息共享与披露

我们不会向第三方共享、转让您的个人信息。

### 四、您的权利

您有权访问、更正、删除您的个人信息，以及注销账号。
      `
    }
  });
});

router.post('/send-code', [
  body('contact').isString().notEmpty()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { contact } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const stmt = db.prepare(`
      INSERT INTO verification_codes (contact, code, type, expires_at)
      VALUES (?, ?, 'register', ?)
    `);
    stmt.run(contact, code, expiresAt);

    console.log(`验证码: ${contact} -> ${code}`);

    res.json({ success: true, message: '验证码已发送', data: { code } });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ success: false, message: '发送验证码失败' });
  }
});

router.post('/verify-code', [
  body('contact').isString().notEmpty(),
  body('code').isString().notEmpty()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { contact, code } = req.body;

    const verification = db.prepare(`
      SELECT * FROM verification_codes
      WHERE contact = ? AND code = ? AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).get(contact, code, new Date().toISOString());

    if (!verification) {
      return res.status(400).json({ success: false, message: '验证码无效或已过期' });
    }

    res.json({ success: true, message: '验证成功' });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ success: false, message: '验证失败' });
  }
});

router.post('/register', [
  body('contact').isString().notEmpty(),
  body('code').isString().notEmpty(),
  body('username').isString().isLength({ min: 2, max: 20 }),
  body('password').isString().isLength({ min: 6 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { contact, code, username, password } = req.body;

    const verification = db.prepare(`
      SELECT * FROM verification_codes
      WHERE contact = ? AND code = ? AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).get(contact, code, new Date().toISOString());

    if (!verification) {
      return res.status(400).json({ success: false, message: '验证码无效或已过期' });
    }

    const existingUser = db.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?
    `).get(username, contact, contact);

    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或联系方式已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const isEmail = contact.includes('@');

    const userId = db.prepare(`
      INSERT INTO users (username, ${isEmail ? 'email' : 'phone'}, password)
      VALUES (?, ?, ?)
    `).run(username, contact, hashedPassword).lastInsertRowid;

    db.prepare(`
      INSERT INTO privacy_policy_agreements (user_id, agreed_version)
      VALUES (?, '1.0.0')
    `).run(userId);

    const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const user = db.prepare('SELECT id, username, email, phone, avatar, bio FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: '注册成功',
      data: { token, user }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

router.post('/login', [
  body('contact').isString().notEmpty(),
  body('password').isString().notEmpty()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { contact, password } = req.body;

    const user = db.prepare(`
      SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?
    `).get(contact, contact, contact);

    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: '登录成功',
      data: { token, user: userData }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, phone, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

module.exports = router;
