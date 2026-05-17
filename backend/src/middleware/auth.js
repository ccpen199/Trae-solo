const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');
const { get } = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key_2024_05_16';

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return error(res, '请先登录', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, username, phone, nickname, avatar, is_vip, vip_expire_at FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return error(res, '用户不存在', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, '登录已过期，请重新登录', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await get('SELECT id, username, phone, nickname, avatar, is_vip, vip_expire_at FROM users WHERE id = ?', [decoded.userId]);
      req.user = user || null;
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

module.exports = { auth, optionalAuth };
