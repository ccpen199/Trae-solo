const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const JWT_SECRET = 'stress-tester-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, role, name, email FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const createAuditLog = (userId, action, resourceType, resourceId, oldValue = null, newValue = null, reason = null) => {
  const { v4: uuidv4 } = require('uuid');
  db.prepare(`
    INSERT INTO audit_logs (audit_id, action, resource_type, resource_id, user_id, old_value, new_value, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), action, resourceType, resourceId, userId, oldValue, newValue, reason);
};

module.exports = { authMiddleware, roleMiddleware, createAuditLog, JWT_SECRET };
