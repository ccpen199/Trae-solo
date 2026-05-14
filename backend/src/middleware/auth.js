const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'appliance-rental-secret-key-2026';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未登录，请先登录'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, phone, nickname, avatar, is_verified, balance FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
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
};

const verifyMiddleware = (req, res, next) => {
  if (!req.user || req.user.is_verified !== 1) {
    return res.status(403).json({
      success: false,
      message: '请先完成实名认证后再进行此操作'
    });
  }
  next();
};

const adminAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }
    const admin = db.prepare('SELECT id, username, role FROM admin_users WHERE id = ?').get(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '管理员不存在'
      });
    }
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录'
    });
  }
};

module.exports = {
  authMiddleware,
  verifyMiddleware,
  adminAuthMiddleware,
  JWT_SECRET
};
