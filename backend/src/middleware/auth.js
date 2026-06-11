const jwt = require('jsonwebtoken');
const db = require('../utils/database');

function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先通过赣服通认证' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'jx_rs_session_secret_2024');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期' });
  }
}

function adminRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'jx_rs_session_secret_2024');
    if (decoded.adminId) {
      const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(decoded.adminId);
      if (admin) {
        req.admin = admin;
        return next();
      }
    }
    return res.status(403).json({ code: 403, message: '需要管理员权限' });
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期' });
  }
}

module.exports = { authRequired, adminRequired };
