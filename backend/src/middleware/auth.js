const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'logistics-jwt-secret-2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未授权，请先登录' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT u.*, r.code as role_code, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?').get(decoded.userId);
    
    if (!user || user.status !== 1) {
      return res.status(401).json({ message: '用户不存在或已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token无效或已过期' });
  }
};

const checkPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    if (req.user.role_code === 'admin') {
      return next();
    }

    const userPermissions = db.prepare('SELECT permissions FROM roles WHERE id = ?').get(req.user.role_id);
    
    if (!userPermissions) {
      return res.status(403).json({ message: '无权限访问' });
    }

    const userPerms = userPermissions.permissions ? userPermissions.permissions.split(',') : [];
    const hasPermission = permissions.some(p => userPerms.includes(p) || userPerms.includes('all'));

    if (!hasPermission) {
      return res.status(403).json({ message: '无权限访问' });
    }

    next();
  };
};

module.exports = { authMiddleware, checkPermission };
