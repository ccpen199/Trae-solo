const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      phone: decoded.phone
    };
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录',
      data: null
    });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        phone: decoded.phone
      };
    } catch (error) {
      // Token无效时不阻止访问，保持未登录状态
    }
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth
};
