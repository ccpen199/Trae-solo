const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, nickname, avatar, is_admin FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token 无效' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.is_admin !== 1) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
