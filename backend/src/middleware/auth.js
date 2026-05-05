const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'xm-20784-scheduling-system-jwt-secret-key';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT u.*, b.name as branch_name, b.is_headquarters, p.name as position_name, p.permissions
      FROM users u
      JOIN branches b ON u.branch_id = b.id
      JOIN positions p ON u.position_id = p.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user || user.status !== 1) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = {
      id: user.id,
      erpId: user.erp_id,
      name: user.name,
      branchId: user.branch_id,
      branchName: user.branch_name,
      isHeadquarters: user.is_headquarters === 1,
      positionId: user.position_id,
      positionName: user.position_name,
      permissions: JSON.parse(user.permissions || '[]')
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const hasPermission = requiredPermissions.some(perm => 
      req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: '无权限执行此操作' });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  checkPermission
};
