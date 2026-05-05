const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未登录或登录已过期'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(user.role_id);
    const dept = user.department_id 
      ? db.prepare('SELECT * FROM departments WHERE id = ?').get(user.department_id)
      : null;

    req.user = {
      ...user,
      role: role,
      department: dept,
      roleCode: role?.code
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token无效或已过期'
    });
  }
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.roleCode;
    
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    if (userRole === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

const financeOrAdminMiddleware = (req, res, next) => {
  const userRole = req.user?.roleCode;
  
  if (userRole === 'super_admin' || userRole === 'finance') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '只有财务或超级管理员可以操作'
  });
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  financeOrAdminMiddleware
};
