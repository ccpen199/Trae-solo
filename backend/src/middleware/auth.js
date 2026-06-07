const jwt = require('jsonwebtoken');
const db = require('../database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId);
    
    if (!dbUser || dbUser.status !== 'active') {
      return res.status(403).json({ error: '用户不存在或已禁用' });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      role: dbUser.role,
      centerId: dbUser.center_id,
      unitId: dbUser.unit_id,
      developerId: dbUser.developer_id
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的认证令牌' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function requireCenterAccess(req, res, next) {
  if (req.user.role === 'super_admin') {
    return next();
  }
  
  const centerId = parseInt(req.params.centerId || req.body.center_id || req.query.centerId);
  if (centerId && centerId !== req.user.centerId) {
    return res.status(403).json({ error: '只能访问所属中心数据' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  requireCenterAccess
};
