const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      req.role = { name: 'guest', level: 0, permissions: ['view_public'] };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || user.status === 'banned') {
      req.user = null;
      req.role = { name: 'guest', level: 0, permissions: ['view_public'] };
      return next();
    }

    req.user = user;
    req.role = user.role || { name: 'user', level: 10, permissions: [] };
    next();
  } catch (error) {
    req.user = null;
    req.role = { name: 'guest', level: 0, permissions: ['view_public'] };
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
  if (req.user.status === 'banned') {
    return res.status(403).json({
      success: false,
      message: '您的账户已被封禁'
    });
  }
  next();
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const permissions = req.role?.permissions || [];
    if (!permissions.includes(permission) && req.role?.level < 100) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    next();
  };
};

const requireRoleLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const userLevel = req.role?.level || 0;
    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要更高等级的角色'
      });
    }
    next();
  };
};

const isAdmin = (req) => {
  return req.role?.level >= 100;
};

const isModerator = (req) => {
  return req.role?.level >= 50;
};

const isOwnerOrAdmin = (req, ownerId) => {
  if (!req.user) return false;
  if (isAdmin(req)) return true;
  return req.user.id === ownerId;
};

module.exports = {
  authMiddleware,
  requireAuth,
  requirePermission,
  requireRoleLevel,
  isAdmin,
  isModerator,
  isOwnerOrAdmin
};
