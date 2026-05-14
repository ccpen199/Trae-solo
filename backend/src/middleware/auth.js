const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');
const config = require('../config');
const { getDb } = require('../database');
const logger = require('../utils/logger');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error('未授权访问', null, 401));
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json(error('Token 无效或已过期', null, 401));
  }

  (async () => {
    try {
      const db = getDb();
      const user = await db.prepare('SELECT id, username, nickname, avatar, role, status FROM users WHERE id = ?').get(decoded.id);
      
      if (!user || user.status !== 1) {
        return res.status(401).json(error('用户不存在或已被禁用', null, 401));
      }

      req.user = user;
      next();
    } catch (err) {
      logger.error('Auth middleware error:', err);
      return res.status(500).json(error('认证处理失败', null, 500));
    }
  })();
}

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json(error('未授权访问', null, 401));
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json(error('无权限访问', null, 403));
  }

  next();
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      (async () => {
        try {
          const db = getDb();
          const user = await db.prepare('SELECT id, username, nickname, avatar, role, status FROM users WHERE id = ?').get(decoded.id);
          if (user && user.status === 1) {
            req.user = user;
          }
        } catch (err) {
          logger.error('Optional auth error:', err);
        } finally {
          next();
        }
      })();
      return;
    }
  }

  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware
};
