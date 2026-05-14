const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'pmcaff_jwt_secret_key_2026_production';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未登录或登录已过期',
        code: 401
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未登录或登录已过期',
        code: 401
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await db.prepare('SELECT id, username, email, phone, nickname, avatar, bio, role, status FROM users WHERE id = ?').get(decoded.id);
    
    if (!user || user.status !== 1) {
      return res.status(401).json({
        success: false,
        message: '账号不存在或已被禁用',
        code: 401
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录',
        code: 401
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的登录凭证',
        code: 401
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '无权限访问此接口',
      code: 403
    });
  }
  next();
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.prepare('SELECT id, username, email, phone, nickname, avatar, bio, role, status FROM users WHERE id = ?').get(decoded.id);
        if (user && user.status === 1) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // 忽略可选认证的错误
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware
};
