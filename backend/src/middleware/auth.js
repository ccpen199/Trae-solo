const jwt = require('jsonwebtoken');
const db = require('../database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'subscription_billing_jwt_secret_key_2026';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: '用户不存在或已被禁用'
      });
    }
    
    const userRoles = db.all(`
      SELECT r.* 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [user.id]);
    
    const userPermissions = db.all(`
      SELECT DISTINCT p.*
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ?
    `, [user.id]);
    
    req.user = {
      ...user,
      roles: userRoles.map(r => r.name),
      permissions: userPermissions.map(p => p.name)
    };
    
    next();
  } catch (error) {
    logger.error('JWT 验证失败:', error);
    return res.status(401).json({
      success: false,
      error: '无效的认证令牌'
    });
  }
};

const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证'
      });
    }
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    const hasRequiredRole = roles.some(role => req.user.roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    next();
  };
};

const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证'
      });
    }
    
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    const hasRequiredPermission = permissions.some(
      perm => req.user.permissions.includes(perm)
    );
    
    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    next();
  };
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (user && user.status === 'active') {
      const userRoles = db.all(`
        SELECT r.* 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
      `, [user.id]);
      
      const userPermissions = db.all(`
        SELECT DISTINCT p.*
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ?
      `, [user.id]);
      
      req.user = {
        ...user,
        roles: userRoles.map(r => r.name),
        permissions: userPermissions.map(p => p.name)
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  
  next();
};

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  optionalAuth
};
