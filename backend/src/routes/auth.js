const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');

router.post('/register', (req, res) => {
  try {
    const { username, password, phone, openid } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码必填' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    db.prepare(`INSERT INTO users (id, username, password, phone, openid) VALUES (?, ?, ?, ?, ?)`).run(
      userId, username, hashedPassword, phone || null, openid || null
    );

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, data: { token, userId, username } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password, openid } = req.body;

    let user;
    if (openid) {
      user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
      if (!user) {
        return res.status(401).json({ success: false, message: '微信未注册' });
      }
    } else {
      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码必填' });
      }
      user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) {
        return res.status(401).json({ success: false, message: '用户不存在' });
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ success: false, message: '密码错误' });
      }
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        userId: user.id,
        username: user.username,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.get('/profile', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, phone, created_at FROM users WHERE id = ?').get(req.user.id);

    const couponStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used
      FROM coupons WHERE user_id = ?
    `).get(req.user.id);

    res.json({
      success: true,
      data: {
        ...user,
        couponStats
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.post('/bind-openid', authenticate, (req, res) => {
  try {
    const { openid } = req.body;

    if (!openid) {
      return res.status(400).json({ success: false, message: 'openid必填' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE openid = ? AND id != ?').get(openid, req.user.id);
    if (existing) {
      return res.status(400).json({ success: false, message: '该微信已绑定其他账号' });
    }

    db.prepare('UPDATE users SET openid = ? WHERE id = ?').run(openid, req.user.id);

    res.json({ success: true, message: '绑定成功' });
  } catch (error) {
    console.error('Bind openid error:', error);
    res.status(500).json({ success: false, message: '绑定失败' });
  }
});

module.exports = router;
