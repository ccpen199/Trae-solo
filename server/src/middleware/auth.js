const { verifyToken } = require('../config/jwt');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: '无效的认证格式'
      });
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被封禁'
      });
    }

    req.user = user.toPublicJSON();
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return next();
    }

    User.findByPk(decoded.id).then(user => {
      if (user && user.status === 'active') {
        req.user = user.toPublicJSON();
      }
      next();
    }).catch(() => next());
  } catch (error) {
    next();
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole
};
