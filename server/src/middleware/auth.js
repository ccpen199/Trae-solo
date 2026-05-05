const jwt = require('jsonwebtoken');
const db = require('../config/database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'smart-home-jwt-secret-key-2024', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    
    const dbUser = db.get('SELECT id, username, role FROM users WHERE id = ?', [user.userId]);
    if (!dbUser) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = dbUser;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'smart-home-jwt-secret-key-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken
};
