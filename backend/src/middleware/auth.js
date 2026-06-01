const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'local-info-platform-secret-key-2024');
    const user = db.prepare('SELECT id, phone, nickname, avatar, user_type, is_verified FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

const requireMerchant = (req, res, next) => {
  if (req.user.user_type !== 'b' && req.user.user_type !== 'admin') {
    return res.status(403).json({ error: '需要商家权限' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

module.exports = { authenticate, requireMerchant, requireAdmin };
