const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const router = express.Router();
const { JWT_SECRET } = process.env;

const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone);
const validatePassword = (password) => password && password.length >= 6;

router.post('/send-code', (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!validatePhone(phone)) {
      return res.json({ success: false, message: '手机号格式不正确' });
    }

    const code = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const stmt = db.prepare('INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)');
    stmt.run(phone, code, expiresAt);

    res.json({ success: true, message: '验证码已发送（测试验证码：123456）' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { phone, code, password, name } = req.body;

    if (!validatePhone(phone)) {
      return res.json({ success: false, message: '手机号格式不正确' });
    }
    if (!code || code !== '123456') {
      return res.json({ success: false, message: '验证码不正确' });
    }
    if (!validatePassword(password)) {
      return res.json({ success: false, message: '密码至少6位' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.json({ success: false, message: '该手机号已注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare('INSERT INTO users (phone, password, name) VALUES (?, ?, ?)');
    const result = stmt.run(phone, hashedPassword, name || '老师');
    const userId = result.lastInsertRowid;

    const token = jwt.sign({ id: userId, phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      message: '注册成功', 
      data: { token, user: { id: userId, phone, name: name || '老师' } }
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!validatePhone(phone)) {
      return res.json({ success: false, message: '手机号格式不正确' });
    }
    if (!password) {
      return res.json({ success: false, message: '请输入密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ success: false, message: '密码错误' });
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      message: '登录成功', 
      data: { token, user: { id: user.id, phone: user.phone, name: user.name, avatar: user.avatar } }
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

router.get('/profile', require('../middleware/auth'), (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, name, avatar FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;