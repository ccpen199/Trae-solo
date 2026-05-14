const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 1) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const db = getDb();
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
      
      if (user && user.status === 1) {
        req.user = user;
      }
    } catch (err) {
      // Token 无效，继续作为未登录用户处理
    }
  }
  
  next();
};

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(decoded.adminId);
    
    if (!admin || admin.status !== 1) {
      return res.status(401).json({ error: '管理员不存在或已被禁用' });
    }
    
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

const getCurrentUser = (req) => {
  return req.user || null;
};

const isVip = (user) => {
  if (!user) return false;
  if (user.is_vip !== 1) return false;
  if (!user.vip_expire_time) return true;
  return new Date(user.vip_expire_time) > new Date();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  getCurrentUser,
  isVip
};
