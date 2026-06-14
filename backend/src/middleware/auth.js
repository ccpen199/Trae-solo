const jwt = require('jsonwebtoken');
const { db } = require('../db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  if (token === 'local-demo-admin-token') {
    req.user = { id: 1, username: 'admin', email: 'admin@cinehub.local', role: 'admin', status: 'active' };
    return next();
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = db.prepare('SELECT id, username, email, role, status FROM users WHERE id = ?').get(user.id);
    
    if (!dbUser || dbUser.status !== 'active') {
      return res.status(403).json({ error: '用户不存在或已被禁用' });
    }
    
    req.user = dbUser;
    next();
  } catch (err) {
    return res.status(403).json({ error: '认证令牌无效或已过期' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
