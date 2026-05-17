const jwt = require('jsonwebtoken');
const db = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, phone, nickname, avatar, level, exp, coins, vip_type, vip_expire_at, is_verified, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 1) {
      return res.status(401).json({ success: false, message: '用户不存在或已被禁用' });
    }

    const permissions = db.prepare('SELECT * FROM level_permissions WHERE level = ?').get(user.level);
    user.permissions = permissions || {};
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token无效或已过期' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT id, phone, nickname, avatar, level, exp, coins, vip_type, vip_expire_at, is_verified, status FROM users WHERE id = ?').get(decoded.userId);
      
      if (user && user.status === 1) {
        const permissions = db.prepare('SELECT * FROM level_permissions WHERE level = ?').get(user.level);
        user.permissions = permissions || {};
        req.user = user;
      }
    } catch (error) {
      // Token无效，继续作为未登录用户
    }
  }
  next();
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  if (!req.user.permissions || !req.user.permissions[permission]) {
    return res.status(403).json({ success: false, message: '权限不足，请提升会员等级' });
  }
  
  next();
};

const requireVip = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  if (req.user.vip_type === 0) {
    return res.status(403).json({ success: false, message: '此内容需要大会员' });
  }
  
  if (req.user.vip_expire_at && req.user.vip_expire_at < Math.floor(Date.now() / 1000)) {
    return res.status(403).json({ success: false, message: '大会员已过期' });
  }
  
  next();
};

module.exports = { authenticateToken, optionalAuth, requirePermission, requireVip };
