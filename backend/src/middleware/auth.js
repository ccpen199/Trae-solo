const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.get('SELECT id, username, role, name, email FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const checkAppPermission = (permissionType) => {
  return async (req, res, next) => {
    const { appId } = req.params;
    const userId = req.user.id;
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    const permission = await db.get(
      'SELECT * FROM permissions WHERE user_id = ? AND app_id = ? AND permission_type = ?',
      [userId, appId, permissionType]
    );
    
    if (!permission) {
      return res.status(403).json({ error: '无此应用操作权限' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  checkAppPermission
};
