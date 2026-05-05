const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 生成 JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 用户注册
router.post(
  '/register',
  [
    body('username').isLength({ min: 2, max: 50 }).withMessage('用户名长度应在 2-50 个字符'),
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码至少 6 个字符'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { username, email, password, phone } = req.body;

      const existingUser = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在',
        });
      }

      const user = await User.create({
        username,
        email,
        password,
        phone,
        role: 'user',
        status: 'active',
      });

      const token = generateToken(user.id);

      const userData = user.toJSON();
      delete userData.password;

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: userData,
          token,
        },
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 用户登录
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误',
        });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误',
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '账户已被禁用',
        });
      }

      const token = generateToken(user.id);

      const userData = user.toJSON();
      delete userData.password;

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: userData,
          token,
        },
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 获取当前用户信息
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userData = req.user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message,
    });
  }
});

// 更新用户信息
router.put(
  '/profile',
  authenticate,
  [
    body('username').optional().isLength({ min: 2, max: 50 }).withMessage('用户名长度应在 2-50 个字符'),
    body('phone').optional().isNumeric().isLength({ min: 10, max: 15 }).withMessage('请输入有效的手机号'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { username, phone, address } = req.body;
      const userId = req.user.id;

      const updateData = {};
      if (username) updateData.username = username;
      if (phone) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;

      await User.update(updateData, {
        where: { id: userId },
      });

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      res.json({
        success: true,
        message: '更新成功',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

// 修改密码
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少 6 个字符'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '验证失败',
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findByPk(userId);

      const isPasswordValid = await user.validatePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '当前密码错误',
        });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: '密码修改成功',
      });
    } catch (error) {
      console.error('修改密码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message,
      });
    }
  }
);

module.exports = router;
