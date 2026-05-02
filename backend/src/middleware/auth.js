const { getDb } = require('../database/init');
const { parseJSON } = require('../utils/common');

const db = getDb();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  const token = authHeader.substring(7);
  
  const user = db.prepare('SELECT * FROM employees WHERE id = ? AND status = 1').get(token.split('-')[0]);
  
  if (!user) {
    return res.status(401).json({ success: false, message: '无效的token' });
  }
  
  req.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    roleId: user.role_id,
    departmentId: user.department_id,
  };
  
  next();
};

const requireRole = (roleCodes) => {
  return (req, res, next) => {
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.user.roleId);
    
    if (!role) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    if (!roleCodes.includes(role.code)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    next();
  };
};

const requireDepartmentLeader = (req, res, next) => {
  const dept = db.prepare('SELECT * FROM departments WHERE leader_id = ?').get(req.user.id);
  
  if (!dept) {
    return res.status(403).json({ success: false, message: '需要部门负责人权限' });
  }
  req.user.department = dept;
  next();
};

const getCurrentUser = (req) => {
  return req.user;
};

module.exports = {
  authenticate,
  requireRole,
  requireDepartmentLeader,
  getCurrentUser,
};
