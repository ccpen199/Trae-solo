const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'short-video-app-secret-key-2024';

router.post('/send-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      });
    }

    const { phone } = req.body;
    
    res.json({
      success: true,
      message: '验证码已发送',
      data: { code: '123456' }
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ 
      success: false, 
      message: '发送验证码失败' 
    });
  }
});

router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('验证码格式错误')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
      });
    }

    const { phone, code } = req.body;

    const validCodes = ['123456', '12345', '111111', '000000', '888888'];
    if (!validCodes.includes(code)) {
      return res.status(400).json({ 
        success: false, 
        message: '验证码错误，测试验证码：123456' 
      });
    }

    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

    if (!user) {
      const nickname = `用户${phone.slice(-4)}`;
      const result = db.prepare(
        'INSERT INTO users (phone, nickname, avatar) VALUES (?, ?, ?)'
      ).run(phone, nickname, `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`);
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password;

    res.json({
      success: true,
      message: '登录成功',
      data: { user, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请重试' 
    });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, nickname, avatar, bio, followers_count, following_count, works_count, created_at FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
});

router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { nickname, avatar, bio } = req.body;
    
    db.prepare(
      'UPDATE users SET nickname = ?, avatar = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(nickname, avatar, bio, req.user.id);

    const user = db.prepare('SELECT id, phone, nickname, avatar, bio, followers_count, following_count, works_count FROM users WHERE id = ?').get(req.user.id);

    res.json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新失败，请重试' 
    });
  }
});

module.exports = router;
