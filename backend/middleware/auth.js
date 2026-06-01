const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'novel-platform-secret-key-2024');
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' });
  }
};

const roleMiddleware = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware };
