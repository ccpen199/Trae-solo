const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'furniture_platform_jwt_secret_key_2024';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
      code: 401
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录',
      code: 401
    });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token 无效，继续作为未登录用户
    }
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
