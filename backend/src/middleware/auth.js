const jwt = require('jsonwebtoken');
const { db } = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'entertainment_ticket_secret_key_2024', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    
    db.get('SELECT id, username, email, role, real_name, phone FROM users WHERE id = ?', [user.id], (err, dbUser) => {
      if (err || !dbUser) {
        return res.status(403).json({ error: '用户不存在' });
      }
      req.user = dbUser;
      next();
    });
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: '需要管理员权限' });
  }
};

module.exports = { authenticateToken, requireAdmin };
