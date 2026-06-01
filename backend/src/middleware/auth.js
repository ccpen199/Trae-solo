const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, real_name, role, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
};

const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!roles.includes(req.user.role)) {
      const auditStmt = db.prepare(`
        INSERT INTO audit_logs (audit_id, user_id, action, resource_type, resource_id, ip_address, status, denial_reason)
        VALUES (?, ?, ?, ?, ?, ?, 'denied', ?)
      `);
      auditStmt.run(
        `audit_${Date.now()}`,
        req.user.id,
        req.method + ' ' + req.path,
        'api_access',
        req.path,
        req.ip,
        '权限不足，需要角色: ' + roles.join(', ')
      );

      return res.status(403).json({ 
        error: '权限不足',
        requiredRoles: roles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

const logAudit = (action, resourceType, resourceId, oldValue = null, newValue = null) => {
  return (req, res, next) => {
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (audit_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'allowed')
    `);
    
    auditStmt.run(
      `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      req.user?.id || null,
      action,
      resourceType,
      resourceId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      req.ip,
      req.get('User-Agent')
    );

    next();
  };
};

module.exports = { authenticateToken, requireRoles, logAudit };
