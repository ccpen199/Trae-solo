const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'tianfutong_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.error('未提供认证令牌', 401);
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, phone, real_name, user_type, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 1) {
      return res.error('用户不存在或已被禁用', 401);
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.error('无效的认证令牌', 401);
  }
}

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, phone, real_name, user_type, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (user && user.status === 1) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.error('未提供认证令牌', 401);
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = db.prepare('SELECT id, username, real_name, role, status, region FROM admins WHERE id = ?').get(decoded.adminId);
    
    if (!admin || admin.status !== 1) {
      return res.error('管理员不存在或已被禁用', 401);
    }
    
    req.admin = admin;
    next();
  } catch (err) {
    return res.error('无效的认证令牌', 401);
  }
}

function generateUserToken(userId) {
  return jwt.sign({ userId, type: 'user' }, JWT_SECRET, { expiresIn: '30d' });
}

function generateAdminToken(adminId) {
  return jwt.sign({ adminId, type: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticateToken, optionalAuthenticate, authenticateAdmin, generateUserToken, generateAdminToken, JWT_SECRET };
