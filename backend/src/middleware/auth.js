const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'yipinxian_jwt_secret_key_2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, phone, nickname, avatar, role, is_member, is_verified, city FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, username, phone, nickname, avatar, role, is_member, is_verified, city FROM users WHERE id = ?').get(decoded.userId);
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Token 无效，不设置 user
    }
  }
  
  next();
};

const verifiedUserOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  if (!req.user.is_verified) {
    return res.status(403).json({ success: false, message: '需要认证账号才能执行此操作' });
  }
  
  next();
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
  authMiddleware,
  optionalAuth,
  verifiedUserOnly,
  generateToken
};
