
const jwt = require('jsonwebtoken');
const { db } = require('../database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'referral_platform_secret_key_2024');
    const userRow = db.prepare('SELECT id, username, phone, role, wechat_id, avatar, current_company_id FROM users WHERE id = ?').get(user.id);
    
    if (!userRow) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = userRow;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         '127.0.0.1';
}

module.exports = { authenticateToken, requireRole, getClientIp };
