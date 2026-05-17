const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { run, get, all } = require('../db');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post('/login', [
  body('login_type').isIn(['phone', 'qq', 'weibo', 'wechat']).withMessage('无效的登录方式'),
  body('nickname').optional().isString(),
  body('phone').optional().isString(),
  body('openid').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { login_type, phone, nickname, openid, gender, avatar } = req.body;
    
    let user;
    
    if (login_type === 'phone' && phone) {
      user = await get('SELECT * FROM users WHERE phone = ?', [phone]);
      
      if (!user) {
        const result = await run(
          'INSERT INTO users (phone, nickname, login_type, gender, avatar) VALUES (?, ?, ?, ?, ?)',
          [phone, nickname || `用户${Date.now()}`, login_type, gender || 'unknown', avatar || '']
        );
        user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      }
    } else {
      user = await get('SELECT * FROM users WHERE login_type = ? AND openid = ?', [login_type, openid]);
      
      if (!user) {
        const result = await run(
          'INSERT INTO users (openid, nickname, login_type, gender, avatar) VALUES (?, ?, ?, ?, ?)',
          [openid, nickname || `用户${Date.now()}`, login_type, gender || 'unknown', avatar || '']
        );
        user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
      }
    }

    await run('UPDATE users SET is_online = 1, last_online_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    user.is_online = 1;

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          gender: user.gender,
          is_online: user.is_online
        }
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请重试'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await run('UPDATE users SET is_online = 0, last_online_at = CURRENT_TIMESTAMP WHERE id = ?', [decoded.userId]);
      } catch (e) {}
    }
    
    res.json({
      success: true,
      message: '退出成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '退出失败'
    });
  }
});

module.exports = router;
