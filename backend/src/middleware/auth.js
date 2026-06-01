const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'news-platform-secret-key-2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供访问令牌' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '令牌无效或已过期' });
  }
}

module.exports = { authenticateToken };
