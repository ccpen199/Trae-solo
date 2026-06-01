const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, phone, real_name, region_code, role, status FROM users WHERE id = ?').get(decoded.userId);
    if (!user || user.status !== 1) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证令牌无效或已过期' });
  }
};

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = db.prepare('SELECT id, username, real_name, role, region_code, level, status FROM admins WHERE id = ?').get(decoded.adminId);
    if (!admin || admin.status !== 1) {
      return res.status(401).json({ error: '管理员不存在或已被禁用' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证令牌无效或已过期' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const requireAdminLevel = (level) => {
  return (req, res, next) => {
    if (!req.admin || req.admin.level > level) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  requireRole,
  requireAdminLevel,
};
