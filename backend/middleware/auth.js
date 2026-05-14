const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'me-tao-secret-key-2026';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(unauthorized('请先登录'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      taobao_account: decoded.taobao_account,
      nickname: decoded.nickname
    };
    next();
  } catch (err) {
    return res.status(401).json(unauthorized('登录已过期，请重新登录'));
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id,
        taobao_account: decoded.taobao_account,
        nickname: decoded.nickname
      };
    } catch (err) {
      // 不中断请求，继续作为游客
    }
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
