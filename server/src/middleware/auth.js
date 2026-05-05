const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    return res.status(401).json({
      success: false,
      message: '认证失败',
      error: error.message,
    });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限',
      });
    }
    next();
  } catch (error) {
    console.error('管理员权限检查错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
};

module.exports = { authenticate, requireAdmin };
