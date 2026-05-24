const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const JWT_SECRET = 'ball-booking-secret-key-2024';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, nickname, role, level, credit_score FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const logOperation = (action, targetType = null, targetId = null, details = null) => {
  return (req, res, next) => {
    next();
    const ip = req.ip || req.connection.remoteAddress;
    db.prepare(`
      INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user?.id || null,
      action,
      targetType,
      targetId,
      details ? JSON.stringify(details) : null,
      ip
    );
  };
};

module.exports = { authenticate, requireRole, logOperation, JWT_SECRET };
