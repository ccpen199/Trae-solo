const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { error } = require('../utils/response');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error('请先登录'));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    
    db.get('SELECT id, nickname, phone, avatar, is_vip, vip_expire_at FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err) {
        console.error('Auth error:', err);
        return res.status(500).json(error('验证失败'));
      }
      
      if (!user) {
        return res.status(401).json(error('用户不存在'));
      }
      
      req.user = user;
      next();
    });
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json(error('登录已过期，请重新登录'));
  }
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    
    db.get('SELECT id, nickname, phone, avatar, is_vip, vip_expire_at FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err) {
        req.user = null;
        return next();
      }
      
      req.user = user || null;
      next();
    });
  } catch (err) {
    req.user = null;
    next();
  }
}

module.exports = { authMiddleware, optionalAuthMiddleware };
