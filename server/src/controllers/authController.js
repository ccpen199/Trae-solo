const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, ActivityLog } = require('../models');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { username, email, password, nickname } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或邮箱已被注册' 
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      nickname: nickname || username,
      status: 'active',
      role: 'user'
    });

    await ActivityLog.create({
      userId: user.id,
      action: 'register',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: '注册失败，请稍后重试' 
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }]
      }
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

    if (user.status === 'pending') {
      return res.status(403).json({ 
        success: false, 
        message: '账户待审核，请联系管理员' 
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ 
        success: false, 
        message: '账户已被禁用' 
      });
    }

    user.loginCount += 1;
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    await ActivityLog.create({
      userId: user.id,
      action: 'login',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          status: user.status,
          loginCount: user.loginCount,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    user.lastActiveAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
};

const logout = async (req, res) => {
  try {
    await ActivityLog.create({
      userId: req.user.id,
      action: 'logout',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: '退出登录成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: '退出登录失败' 
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
};
