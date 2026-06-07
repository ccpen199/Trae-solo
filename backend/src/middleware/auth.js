const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'state-grid-secret-key-2024', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'state-grid-secret-key-2024', (err, admin) => {
    if (err || !admin.isAdmin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    req.admin = admin;
    next();
  });
};

module.exports = { authenticateToken, authenticateAdmin };
