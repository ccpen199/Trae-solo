const jwt = require('jsonwebtoken');
const { get } = require('../database/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await get('SELECT id, username, name, role, phone FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: '令牌无效' });
  }
};

const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const canAccessElderly = async (req, res, next) => {
  const elderlyId = req.params.elderlyId || req.body.elderly_id;
  
  if (!elderlyId) {
    return next();
  }

  if (['admin', 'nurse', 'caregiver', 'social_worker', 'logistics'].includes(req.user.role)) {
    return next();
  }

  if (req.user.role === 'family') {
    const access = await get(
      'SELECT * FROM family_access WHERE family_member_id = ? AND elderly_id = ?',
      [req.user.id, elderlyId]
    );
    
    if (access) {
      return next();
    }
  }

  return res.status(403).json({ error: '无权访问该老人信息' });
};

module.exports = { authenticateToken, requireRoles, canAccessElderly };
