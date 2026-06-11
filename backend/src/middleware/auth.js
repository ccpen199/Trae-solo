const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.getAsync('SELECT * FROM users WHERE id = ? AND status = 1', [decoded.userId]);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在或已禁用' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }
};

const requireAuthLevel = (level) => {
  return (req, res, next) => {
    if (!req.user || req.user.auth_level < level) {
      return res.status(403).json({ code: 403, message: '权限不足，需要更高认证等级' });
    }
    next();
  };
};

module.exports = { authenticate, requireAuthLevel };
