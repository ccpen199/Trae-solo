const { db } = require('../models/database');

function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'] || 'admin';
  const userName = req.headers['x-user-name'] || '系统管理员';
  
  const permStmt = db.prepare(`
    SELECT * FROM permissions WHERE user_id = ? AND status = 'active'
  `);
  const permission = permStmt.get(userId);
  
  if (!permission) {
    return res.status(403).json({ error: '用户无权限' });
  }
  
  req.user = {
    id: userId,
    name: userName,
    role: permission.role,
    permissions: JSON.parse(permission.permissions)
  };
  
  next();
}

function checkPermission(requiredPerm) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    
    if (req.user.permissions.includes('all')) {
      return next();
    }
    
    if (!req.user.permissions.includes(requiredPerm)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
}

function logOperation(req, operation, resourceType, resourceId) {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (id, user_id, user_name, operation, resource_type, resource_id, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    req.user?.id || 'anonymous',
    req.user?.name || '匿名用户',
    operation,
    resourceType,
    resourceId,
    req.ip
  );
}

module.exports = { authMiddleware, checkPermission, logOperation };
