const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { phone, password, nickname } = req.body;

    if (!phone || !password) {
      return res.json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.json({
        success: false,
        message: '该手机号已注册'
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)').run(
      phone,
      hashedPassword,
      nickname || `用户${phone.slice(-4)}`
    );

    const token = jwt.sign(
      { userId: result.lastInsertRowid },
      process.env.JWT_SECRET || 'fitlife_jwt_secret_2024_secure_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          phone,
          nickname: nickname || `用户${phone.slice(-4)}`
        }
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({
        success: false,
        message: '密码错误'
      });
    }

    if (user.status !== 1) {
      return res.json({
        success: false,
        message: '账号已被禁用'
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fitlife_jwt_secret_2024_secure_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar
        }
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, nickname, avatar, gender, birthday, balance FROM users WHERE id = ?').get(req.user.id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { nickname, avatar, gender, birthday } = req.body;
    
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, gender = ?, birthday = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      nickname,
      avatar,
      gender,
      birthday,
      req.user.id
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

module.exports = router;
