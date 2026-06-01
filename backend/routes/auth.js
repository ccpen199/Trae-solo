const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/send-code', (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ success: false, message: '请输入正确的手机号' });
    }

    const code = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const stmt = db.prepare('INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)');
    stmt.run(phone, code, expiresAt.toISOString());

    res.json({ success: true, message: '验证码发送成功', code: process.env.NODE_ENV === 'development' ? code : undefined });
  } catch (error) {
    console.error('Send code error:', error);
    res.json({ success: false, message: '验证码发送失败' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { phone, password, code, gesturePassword } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ success: false, message: '请输入正确的手机号' });
    }

    if (!password || password.length < 6) {
      return res.json({ success: false, message: '密码至少6位' });
    }

    if (!code) {
      return res.json({ success: false, message: '请输入验证码' });
    }

    const latestCode = db.prepare(`
      SELECT code, expires_at FROM verification_codes 
      WHERE phone = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(phone);

    if (!latestCode || latestCode.code !== code) {
      return res.json({ success: false, message: '验证码错误' });
    }

    if (new Date(latestCode.expires_at) < new Date()) {
      return res.json({ success: false, message: '验证码已过期' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.json({ success: false, message: '该手机号已注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nickname = `用户${phone.slice(-4)}`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`;

    const stmt = db.prepare(`
      INSERT INTO users (phone, password, gesture_password, nickname, avatar)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(phone, hashedPassword, gesturePassword || null, nickname, avatar);

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const user = db.prepare('SELECT id, phone, nickname, avatar, balance, total_invest, total_earnings FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: '注册成功',
      data: { token, user }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.json({ success: false, message: '注册失败' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.json({ success: false, message: '请输入手机号和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ success: false, message: '密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userInfo } = user;
    delete userInfo.gesture_password;

    res.json({
      success: true,
      message: '登录成功',
      data: { token, user: userInfo }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: '登录失败' });
  }
});

router.post('/gesture-login', (req, res) => {
  try {
    const { phone, gesturePassword } = req.body;

    if (!phone || !gesturePassword) {
      return res.json({ success: false, message: '参数错误' });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }

    if (user.gesture_password !== gesturePassword) {
      return res.json({ success: false, message: '手势密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userInfo } = user;
    delete userInfo.gesture_password;

    res.json({
      success: true,
      message: '登录成功',
      data: { token, user: userInfo }
    });
  } catch (error) {
    console.error('Gesture login error:', error);
    res.json({ success: false, message: '登录失败' });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

module.exports = router;
