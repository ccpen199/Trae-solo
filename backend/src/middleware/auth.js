const jwt = require('jsonwebtoken');
const { getDB } = require('../utils/db');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const user = db.prepare('SELECT id, phone, email, nickname, avatar, vip_type, vip_expire_at, used_space FROM users WHERE id = ?').get(decoded.userId);
    
    if (user) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
  next();
}

function requireVIP(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
  
  const isVip = req.user.vip_type > 0 && 
    (!req.user.vip_expire_at || req.user.vip_expire_at > Date.now());
  
  if (!isVip) {
    return res.status(403).json({
      success: false,
      message: '该功能需要VIP会员权限'
    });
  }
  next();
}

module.exports = { authMiddleware, requireAuth, requireVIP };
