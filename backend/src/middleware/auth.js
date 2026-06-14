const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'renovation-platform-secret-key-2024';

const getDemoUser = () => {
  return db.prepare(`
    SELECT id, username, name, role, phone, email, avatar, company_id, status
    FROM users
    WHERE status = 1
    ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id
    LIMIT 1
  `).get();
};

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      const demoUser = getDemoUser();
      if (demoUser) {
        req.user = demoUser;
        return next();
      }
    }
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, name, role, phone, email, avatar, company_id, status FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.status !== 1) {
      return res.status(401).json({ code: 401, message: '用户不存在或已被禁用' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      const demoUser = getDemoUser();
      if (demoUser) {
        req.user = demoUser;
        return next();
      }
    }
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }
    next();
  };
};

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { auth, requireRole, signToken };
