const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateToken } = require('../config/jwt');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 2, max: 50 }).withMessage('用户名长度应为2-50个字符'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 6, max: 50 }).withMessage('密码长度应为6-50个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, email, password, nickname } = req.body;

    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      nickname: nickname || username
    });

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, password } = req.body;

    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ username }, { email: username }]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被封禁'
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, bio, avatar } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (nickname !== undefined) user.nickname = nickname;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: '资料更新成功',
      data: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '更新资料失败'
    });
  }
});

module.exports = router;
