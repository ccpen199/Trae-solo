const jwt = require('jsonwebtoken');
const { db } = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'knowledge-base-secret-key-2024', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }

    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId);
    if (!dbUser) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = dbUser;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'knowledge-base-secret-key-2024', (err, user) => {
    if (err) {
      return next();
    }

    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId);
    if (dbUser) {
      req.user = dbUser;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
};
