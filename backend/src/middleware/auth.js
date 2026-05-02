const jwt = require('jsonwebtoken');
const { getAsync } = require('../config/database');
const { ROLES } = require('../models/initDb');

const JWT_SECRET = process.env.JWT_SECRET || '3d-product-demo-secret-key-2024';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: '令牌无效或已过期'
    });
  }

  req.user = decoded;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要先登录'
      });
    }

    if (req.user.role === ROLES.OPERATOR) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `角色"${req.user.role}"没有权限执行此操作`
      });
    }

    next();
  };
}

function requireOwnershipOrRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要先登录'
      });
    }

    if (req.user.role === ROLES.OPERATOR) {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    const orderId = req.params.orderId || req.body.orderId;
    if (orderId) {
      try {
        const order = await getAsync(
          `SELECT * FROM main_orders WHERE id = ?`,
          [orderId]
        );

        if (order && order.responsible_user_id === req.user.id) {
          return next();
        }

        if (order && order.created_by === req.user.id) {
          return next();
        }
      } catch (err) {
        console.error('检查权限时出错:', err);
      }
    }

    return res.status(403).json({
      success: false,
      error: '您没有权限访问此资源'
    });
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  requireRole,
  requireOwnershipOrRole,
  optionalAuth
};
