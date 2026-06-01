const jwt = require('jsonwebtoken');

const JWT_SECRET = 'gift-mall-secret-key';

function authMiddleware(roles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: '无权限访问' });
      }
      next();
    } catch (err) {
      res.status(401).json({ error: '登录已过期' });
    }
  };
}

module.exports = { authMiddleware, JWT_SECRET };
