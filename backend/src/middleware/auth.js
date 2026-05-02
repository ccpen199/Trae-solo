const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'game-ranking-system-secret-key-2024';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, nickname, role, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: '用户已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要登录' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

const rolePermissions = {
  player: ['match:report', 'match:view:self', 'leaderboard:view', 'reward:view:self', 'reward:claim:self'],
  operator: ['season:manage', 'leaderboard:manage', 'reward:manage', 'rule:manage', 'match:view', 'user:view'],
  customer_service: ['user:view', 'match:view', 'reward:view', 'complaint:handle'],
  anticheat: ['anticheat:review', 'anticheat:manage', 'user:suspend', 'match:view'],
  admin: ['*']
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要登录' });
    }

    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ error: `缺少权限: ${permission}` });
  };
};

const verifyOwnership = (userIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要登录' });
    }

    if (req.user.role === 'admin' || req.user.role === 'operator') {
      return next();
    }

    const targetUserId = req.params[userIdField] || req.body[userIdField];
    
    if (targetUserId && parseInt(targetUserId) !== req.user.id) {
      return res.status(403).json({ error: '只能访问自己的数据' });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  checkPermission,
  verifyOwnership,
  rolePermissions
};
