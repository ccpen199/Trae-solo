const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'product-bar-jwt-secret-key-2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未登录或登录已过期',
      data: null
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT id, username, email, nickname, avatar, role, status, created_at
      FROM users WHERE id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        data: null
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用',
        data: null
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录',
      data: null
    });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare(`
        SELECT id, username, email, nickname, avatar, role, status, created_at
        FROM users WHERE id = ?
      `).get(decoded.userId);
      
      if (user && user.status !== 'blocked') {
        req.user = user;
      }
    } catch (error) {
      // Token无效但不阻止请求
    }
  }
  next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        data: null
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '无权限执行此操作',
        data: null
      });
    }

    next();
  };
}

function requireBarOwnerOrOperator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
      data: null
    });
  }

  if (req.user.role === 'admin' || req.user.role === 'operator') {
    return next();
  }

  const barId = req.params.barId || req.body.bar_id;
  if (!barId) {
    return res.status(400).json({
      success: false,
      message: '缺少吧ID',
      data: null
    });
  }

  const membership = db.prepare(`
    SELECT role FROM bar_members 
    WHERE bar_id = ? AND user_id = ?
  `).get(barId, req.user.id);

  if (membership && (membership.role === 'owner' || membership.role === 'moderator')) {
    return next();
  }

  const bar = db.prepare('SELECT owner_id FROM product_bars WHERE id = ?').get(barId);
  if (bar && bar.owner_id === req.user.id) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '无权限执行此操作',
    data: null
  });
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRoles,
  requireBarOwnerOrOperator
};
