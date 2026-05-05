const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '请先登录'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yijie_jwt_secret_key_2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录'
    });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yijie_jwt_secret_key_2024');
      req.user = decoded;
    } catch (error) {
    }
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
