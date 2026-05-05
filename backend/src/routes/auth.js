const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Role } = require('../models');
const { requireAuth } = require('../middleware/auth');
const logService = require('../services/logService');

const router = express.Router();

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('用户名长度应为3-20个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, password, email, nickname } = req.body;

    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被注册'
        });
      }
    }

    const userRole = await Role.findOne({ where: { name: 'user' } });

    const user = await User.create({
      username,
      password,
      email,
      nickname: nickname || username,
      status: 'active',
      roleId: userRole?.id
    });

    await logService.logRegister(req, user);

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          signature: user.signature,
          status: user.status,
          role: userRole?.name || 'user',
          roleLevel: userRole?.level || 10
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

router.post('/login', [
  body('username').trim().notEmpty().withMessage('请输入用户名'),
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
      where: { username },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '您的账户已被封禁'
      });
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip || req.connection?.remoteAddress;
    await user.save();

    await logService.logLogin(req, user);

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          signature: user.signature,
          status: user.status,
          role: user.role?.name || 'user',
          roleLevel: user.role?.level || 10
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    await logService.logLogout(req);
    res.json({
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    console.error('退出登录错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        signature: user.signature,
        status: user.status,
        role: user.role?.name || 'user',
        roleLevel: user.role?.level || 10,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/profile', requireAuth, [
  body('nickname').optional().trim().isLength({ max: 50 }),
  body('email').optional().isEmail(),
  body('signature').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { nickname, email, signature, avatar } = req.body;
    const updateData = {};

    if (nickname) updateData.nickname = nickname;
    if (email) {
      const existingEmail = await User.findOne({
        where: { email, id: { [require('sequelize').Op.ne]: req.user.id } }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被使用'
        });
      }
      updateData.email = email;
    }
    if (signature !== undefined) updateData.signature = signature;
    if (avatar) updateData.avatar = avatar;

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    const updatedUser = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    res.json({
      success: true,
      message: '更新成功',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        nickname: updatedUser.nickname,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        signature: updatedUser.signature,
        role: updatedUser.role?.name || 'user'
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

router.put('/password', requireAuth, [
  body('oldPassword').notEmpty().withMessage('请输入原密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const isPasswordValid = await user.validatePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

module.exports = router;
