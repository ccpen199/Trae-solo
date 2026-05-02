const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tax_planning_jwt_secret_key_2024';

const ROLE_PERMISSIONS = {
  admin: ['view', 'create', 'edit', 'delete', 'submit', 'review', 'approve', 'reject', 'manage_all'],
  finance: ['view_own', 'create', 'edit_own', 'submit', 'supplement'],
  tax_advisor: ['view', 'edit', 'calculate', 'submit_declaration', 'get_receipt', 'reject', 'reassign'],
  enterprise_manager: ['view', 'approve', 'reject', 'request_supplement', 'reassign']
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: '未提供认证令牌' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(decoded.userId, 'active');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在或已禁用' 
      });
    }
    
    req.user = {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '令牌无效或已过期',
      error: error.message 
    });
  }
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }
    
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    
    if (userPermissions.includes('manage_all') || userPermissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: '权限不足',
      requiredPermission: permission,
      userRole: req.user.role
    });
  };
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(decoded.userId, 'active');
      
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          role: user.role
        };
      }
    } catch (error) {
      // Token 无效，跳过
    }
  }
  
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authMiddleware,
  checkPermission,
  optionalAuth,
  generateToken,
  ROLE_PERMISSIONS
};
