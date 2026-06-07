const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '认证令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const sensitiveOperation = (req, res, next) => {
  const { secondFactorCode } = req.body;
  
  if (!secondFactorCode) {
    return res.status(400).json({ 
      error: '敏感操作需要二次验证',
      require2FA: true 
    });
  }

  if (secondFactorCode !== '123456') {
    return res.status(400).json({ error: '二次验证失败' });
  }

  req.secondVerified = true;
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  sensitiveOperation,
};
