const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const store = require('../config/memoryStore');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入参数错误',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    const user = store.findUserByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    const isPasswordValid = await store.validatePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    store.updateLastLogin(user.id);

    const updatedUser = store.findUserById(user.id);

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    try {
      store.createOperationLog({
        userId: user.id,
        username: user.username,
        operationType: store.OPERATION_TYPES.LOGIN,
        targetType: 'user',
        targetId: user.id,
        targetName: user.realName,
        description: '用户登录系统',
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('记录登录日志失败:', logError.message);
    }

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          realName: updatedUser.realName,
          role: updatedUser.role,
          department: updatedUser.department,
          lastLoginAt: updatedUser.lastLoginAt
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      try {
        store.createOperationLog({
          userId: req.user.id,
          username: req.user.username,
          operationType: store.OPERATION_TYPES.LOGOUT,
          targetType: 'user',
          targetId: req.user.id,
          targetName: req.user.realName,
          description: '用户退出系统',
          ipAddress: req.ip || req.connection.remoteAddress
        });
      } catch (logError) {
        console.error('记录登出日志失败:', logError.message);
      }
    }

    res.json({
      success: true,
      message: '退出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          realName: req.user.realName,
          role: req.user.role,
          department: req.user.department,
          isActive: req.user.isActive,
          lastLoginAt: req.user.lastLoginAt
        }
      }
    });
  } catch (error) {
    console.error('获取当前用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入参数错误',
        errors: errors.array()
      });
    }

    const { oldPassword, newPassword } = req.body;
    
    const user = store.findUserByUsername(req.user.username);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const isPasswordValid = await store.validatePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '原密码错误'
      });
    }

    await store.updateUser(user.id, { password: newPassword });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  changePassword
};
