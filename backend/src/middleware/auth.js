const jwt = require('jsonwebtoken');
const { UserRole } = require('../config/enums');

const JWT_SECRET = process.env.JWT_SECRET || 'pv-ops-system-secret-key-2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要登录' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};

const requireOwnerOrInvestor = (req, res, next) => {
  return requireRoles(UserRole.STATION_OWNER, UserRole.INVESTOR, UserRole.ADMIN)(req, res, next);
};

const requireWorker = (req, res, next) => {
  return requireRoles(UserRole.MAINTENANCE_WORKER, UserRole.ADMIN)(req, res, next);
};

module.exports = {
  authenticateToken,
  requireRoles,
  requireOwnerOrInvestor,
  requireWorker
};
