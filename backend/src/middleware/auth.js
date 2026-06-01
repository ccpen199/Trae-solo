const db = require('../models/database');

function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'] || 1;
  const user = db.prepare('SELECT u.*, r.name as role_name, r.permissions FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?').get(userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = {
    ...user,
    permissions: JSON.parse(user.permissions)
  };
  next();
}

function checkPermission(permission) {
  return (req, res, next) => {
    const perms = req.user.permissions;
    const hasPermission = perms.some(p => {
      if (p === permission) return true;
      const [resource] = permission.split(':');
      return p === `${resource}:*` || p === '*';
    });
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden', message: '权限不足' });
    }
    next();
  };
}

module.exports = { authMiddleware, checkPermission };
