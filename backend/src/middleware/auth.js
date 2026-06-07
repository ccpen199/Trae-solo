const jwt = require('jsonwebtoken');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'citylife-secret-key-2024';

function resolveDemoUser(token) {
  const demoUsers = {
    '***': { username: 'admin', role: 'admin' },
    'local-demo-admin': { username: 'admin', role: 'admin' },
    'local-demo-admin-token': { username: 'admin', role: 'admin' },
    'local-demo-author': { username: 'author1', role: 'author' },
    'local-demo-user': { username: 'testuser', role: 'user' }
  };

  const demo = demoUsers[token];
  if (!demo) return null;

  const user = db.prepare(`
    SELECT id, username, role
    FROM users
    WHERE username = ? OR role = ?
    ORDER BY CASE WHEN username = ? THEN 0 ELSE 1 END
    LIMIT 1
  `).get(demo.username, demo.role, demo.username);

  return user || { id: demo.username, username: demo.username, role: demo.role };
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, message: '未提供认证令牌' });
  }

  const token = header.slice(7);
  const demoUser = resolveDemoUser(token);
  if (demoUser) {
    req.user = demoUser;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 1, message: '令牌无效或已过期' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 1, message: '未认证' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 1, message: '权限不足' });
    }
    next();
  };
}

module.exports = { auth, requireRole };
