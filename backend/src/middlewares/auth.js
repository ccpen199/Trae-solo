const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未登录或token已过期',
      data: null
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error('JWT验证失败:', err.message);
    return res.status(401).json({
      code: 401,
      message: 'token无效或已过期',
      data: null
    });
  }
}

module.exports = authMiddleware;
