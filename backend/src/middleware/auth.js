const jwt = require('jsonwebtoken');
const db = require('../utils/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'flight-booking-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '令牌无效' });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '没有权限执行此操作' });
    }
    
    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware
};
