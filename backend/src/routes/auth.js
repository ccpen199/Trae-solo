const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { runQuery, runGet, runRun } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', [
  body('phone').notEmpty().withMessage('手机号不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { phone, password } = req.body;

    const user = await runGet('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '密码错误'
      });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'cat-dog-diary-secret-key-2024',
      { expiresIn: '7d' }
    );

    delete user.password;
    res.json({
      success: true,
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/register', [
  body('phone').notEmpty().withMessage('手机号不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('nickname').notEmpty().withMessage('昵称不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { phone, password, nickname } = req.body;

    const existingUser = await runGet('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const avatar = `https://loremflickr.com/100/100/avatar?random=${Date.now()}`;

    const result = await runRun(`
      INSERT INTO users (phone, password, nickname, avatar)
      VALUES (?, ?, ?, ?)
    `, [phone, hashedPassword, nickname, avatar]);

    const user = await runGet('SELECT id, phone, nickname, avatar, bio, location FROM users WHERE id = ?', [result.lastID]);

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'cat-dog-diary-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await runGet('SELECT id, phone, nickname, avatar, bio, location, created_at FROM users WHERE id = ?', [req.user.id]);
    
    const pets = await runQuery('SELECT * FROM pets WHERE user_id = ?', [req.user.id]);
    
    res.json({
      success: true,
      data: {
        user,
        pets
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
