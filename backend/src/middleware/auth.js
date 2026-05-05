const jwt = require('jsonwebtoken');
const store = require('../config/memoryStore');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌，请先登录'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = store.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期，请重新登录'
      });
    }
    return res.status(403).json({
      success: false,
      message: '令牌无效'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== store.USER_ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = store.findUserById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // 忽略错误，继续执行
    }
  }
  next();
};

const checkPermission = (permissionType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    if (req.user.role === store.USER_ROLES.ADMIN) {
      next();
      return;
    }

    switch (permissionType) {
      case 'read':
        next();
        break;
      case 'write':
        next();
        break;
      case 'delete':
        return res.status(403).json({
          success: false,
          message: '权限不足，注销操作需要管理员权限'
        });
      case 'user_manage':
        return res.status(403).json({
          success: false,
          message: '权限不足，用户管理需要管理员权限'
        });
      default:
        next();
    }
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  checkPermission
};
