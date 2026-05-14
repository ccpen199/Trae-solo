const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { username, password, nickname, phone, identity_type } = req.body;
    
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password, nickname, phone, identity_type) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, nickname || username, phone || '', identity_type || 'student');

    const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const user = db.prepare('SELECT id, username, nickname, avatar, identity_type, identity_verified FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: { token, user }, message: '注册成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '注册失败', error: error.message });
  }
});

router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userInfo } = user;

    res.json({ success: true, data: { token, user: userInfo }, message: '登录成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败', error: error.message });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, nickname, avatar, phone, identity_type, identity_verified, student_id, employee_id, popularity, good_karma, balance, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败', error: error.message });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { nickname, avatar, phone } = req.body;
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(nickname || req.user.nickname, avatar || '', phone || '', req.user.id);
    
    const user = db.prepare('SELECT id, username, nickname, avatar, phone, identity_type, identity_verified FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, data: user, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败', error: error.message });
  }
});

router.post('/verify', authMiddleware, (req, res) => {
  try {
    const { identity_type, student_id, employee_id, name } = req.body;
    
    db.prepare('UPDATE users SET identity_type = ?, student_id = ?, employee_id = ?, identity_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(identity_type, student_id || '', employee_id || '', req.user.id);
    
    res.json({ success: true, message: '认证成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '认证失败', error: error.message });
  }
});

module.exports = router;
