const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'waterdrop-secret-key-2024', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '登录已过期，请重新登录' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };