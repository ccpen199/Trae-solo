const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }

    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    if (!dbUser) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      role: dbUser.role,
      name: dbUser.name
    };
    next();
  });
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
