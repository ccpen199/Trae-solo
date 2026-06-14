const jwt = require('jsonwebtoken');
const { db } = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'local-life-platform-secret-key-2024');
    const user = db.prepare('SELECT id, phone, nickname, is_verified, credit_score FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效' });
  }
};

module.exports = { authenticateToken };
