const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pdd-secret-key-2024';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
      data: null,
      code: 401
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录',
      data: null,
      code: 401
    });
  }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // 忽略错误，继续执行
    }
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
