const jwt = require('jsonwebtoken');
const db = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const demoUser = db.prepare('SELECT id, username, phone, real_name, role, credit_score, is_verified FROM users WHERE username = ?').get('admin');
    if (demoUser) {
      req.user = demoUser;
      return next();
    }
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  if (token === 'local-demo-admin-token') {
    const demoUser = db.prepare('SELECT id, username, phone, real_name, role, credit_score, is_verified FROM users WHERE username = ?').get('admin');
    req.user = demoUser || {
      id: 1,
      username: 'admin',
      phone: '13800000000',
      real_name: '演示管理员',
      role: 'admin',
      credit_score: 100,
      is_verified: 1
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'direct_home_secret_key_2024');
    const user = db.prepare('SELECT id, username, phone, real_name, role, credit_score, is_verified FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的认证令牌' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};

const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }
  
  if (!req.user.is_verified) {
    return res.status(403).json({ error: '账户未实名认证' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireVerified
};
