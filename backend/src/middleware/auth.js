const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = 'gray-release-system-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: '用户不存在或已停用' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

const permissionMiddleware = (resourceType, action) => {
  return (req, res, next) => {
    const user = req.user;
    const appId = req.params.appId || req.body.app_id || req.query.app_id;

    if (user.role === 'admin') {
      return next();
    }

    const permCheck = db.prepare(`
      SELECT COUNT(*) as count FROM permissions 
      WHERE user_id = ? AND (app_id = ? OR app_id IS NULL) 
      AND resource_type = ? AND action = ?
    `);
    
    const result = permCheck.get(user.id, appId, resourceType, action);
    
    if (result.count > 0) {
      return next();
    }

    res.status(403).json({ error: '权限不足' });
  };
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: '角色权限不足' });
    }
  };
};

const createAuditLog = (userId, userName, action, resourceType, resourceId, details, ipAddress) => {
  const { v4: uuidv4 } = require('uuid');
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, userName, action, resourceType, resourceId, JSON.stringify(details), ipAddress);
};

module.exports = {
  authMiddleware,
  permissionMiddleware,
  roleMiddleware,
  createAuditLog,
  JWT_SECRET
};
