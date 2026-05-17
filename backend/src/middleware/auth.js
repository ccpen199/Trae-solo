const jwt = require('jsonwebtoken');
const db = require('../db');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitlife_jwt_secret_2024_secure_key');
    const user = db.prepare('SELECT id, phone, nickname, avatar, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 1) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录'
    });
  }
}

module.exports = authMiddleware;
