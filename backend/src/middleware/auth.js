const db = require('../models/database');

const authMiddleware = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'user-1';
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  
  req.user = user;
  next();
};

const permissionMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: '未授权' });
    }
    
    if (requiredRoles.includes('all') || requiredRoles.includes(user.role)) {
      return next();
    }
    
    const appId = req.params.appId || req.body.app_id;
    if (appId) {
      const perm = db.prepare(
        'SELECT * FROM permissions WHERE user_id = ? AND app_id = ?'
      ).get(user.id, appId);
      
      if (perm && requiredRoles.includes(perm.role)) {
        return next();
      }
    }
    
    return res.status(403).json({ error: '权限不足' });
  };
};

const auditMiddleware = (action, resourceType) => {
  return (req, res, next) => {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress;
    
    res.on('finish', () => {
      if (userId) {
        const resourceId = req.params.id || req.body.id;
        const details = JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          body: Object.keys(req.body || {}),
          statusCode: res.statusCode
        });
        
        db.prepare(`
          INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId, action, resourceType, resourceId, details, ip
        );
      }
    });
    
    next();
  };
};

module.exports = { authMiddleware, permissionMiddleware, auditMiddleware };
