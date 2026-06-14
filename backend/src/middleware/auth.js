const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, user_type, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: '账号已被禁用' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '认证令牌无效或已过期' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (!roles.includes(req.user.user_type)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};

const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, user_type, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch (error) {
    // Token invalid, but don't block - just continue without user
  }
  
  next();
};

module.exports = { authenticate, authenticateOptional, requireRole };
