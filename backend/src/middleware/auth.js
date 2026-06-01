const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = 'churn-prediction-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, role, name, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 1) {
      return res.status(401).json({ error: '用户不存在或已禁用' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

const roleMiddleware = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware, JWT_SECRET };
