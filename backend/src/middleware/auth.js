const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'recycle-platform-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware
};
