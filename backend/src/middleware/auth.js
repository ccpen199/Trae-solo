const jwt = require('jsonwebtoken');
const db = require('../database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    
    const dbUser = db.prepare('SELECT id, username, name, role, email FROM users WHERE id = ?').get(user.id);
    if (!dbUser) {
      return res.status(403).json({ error: '用户不存在' });
    }
    
    req.user = dbUser;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function canEditCase(req, res, next) {
  const caseId = req.params.caseId || req.body.case_id;
  
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无编辑权限' });
  }
  
  next();
}

module.exports = { authenticateToken, requireRole, canEditCase };
