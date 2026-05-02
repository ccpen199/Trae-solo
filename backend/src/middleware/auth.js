const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

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
    
    const dbUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(user.id);
    if (!dbUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    req.user = dbUser;
    next();
  });
};

const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要认证' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};

const requireRepositoryPermission = (permissionLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要认证' });
    }

    const repositoryId = req.params.id || req.body.repository_id;
    
    if (req.user.role === 'admin') {
      return next();
    }

    const permission = db.prepare(`
      SELECT p.permission_level 
      FROM permissions p
      JOIN repositories r ON p.repository_id = r.id
      WHERE p.user_id = ? AND p.repository_id = ?
    `).get(req.user.id, repositoryId);

    const levels = ['read', 'write', 'admin'];
    const requiredIndex = levels.indexOf(permissionLevel);
    const userIndex = permission ? levels.indexOf(permission.permission_level) : -1;

    if (userIndex < requiredIndex) {
      return res.status(403).json({ error: '仓库权限不足' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRoles,
  requireRepositoryPermission
};
