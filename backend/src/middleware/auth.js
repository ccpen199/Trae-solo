const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const cache = require('../config/redis');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const cachedUser = await cache.get(`token:${token}`);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await query(
      'SELECT id, username, role, name, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    const user = result.rows[0];
    
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '用户已被禁用',
      });
    }

    req.user = user;
    await cache.set(`token:${token}`, user, { EX: 300 });

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期',
      });
    }
    return res.status(401).json({
      success: false,
      message: '无效的令牌',
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }

    next();
  };
};

const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const cacheKey = `permission:${req.user.role}:${permissionCode}`;
    const cachedPermission = await cache.get(cacheKey);
    
    if (cachedPermission) {
      if (cachedPermission.hasPermission) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: '权限不足',
        });
      }
    }

    const result = await query(`
      SELECT rp.id FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = $1 AND p.code = $2
    `, [req.user.role, permissionCode]);

    const hasPermission = result.rows.length > 0;
    
    await cache.set(cacheKey, { hasPermission }, { EX: 300 });

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
};