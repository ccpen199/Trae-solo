const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { error } = require('../utils/response');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error('未授权，请先登录', 401));
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(error('登录已过期，请重新登录', 401));
    }
    return res.status(401).json(error('无效的令牌', 401));
  }
};

// 可选认证 - 没有 token 也可以访问，但 req.user 为 undefined
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = {
        id: decoded.userId,
        username: decoded.username,
      };
    } catch (err) {
      // 令牌无效但不阻塞请求
      req.user = undefined;
    }
  }
  
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
