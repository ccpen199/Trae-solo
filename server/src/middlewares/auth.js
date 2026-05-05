const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录或登录已过期' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        include: [{ model: Role, include: [Permission] }]
      });
      
      if (!user) {
        return res.status(401).json({ success: false, message: '用户不存在' });
      }
      
      if (user.status !== 'active') {
        return res.status(403).json({ success: false, message: '账户已被禁用或未激活' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
      }
      return res.status(401).json({ success: false, message: '无效的token' });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  const isAdmin = req.user.user_type === 'admin' || 
    (req.user.Roles && req.user.Roles.some(role => role.code === 'super_admin' || role.code === 'admin'));
  
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  
  next();
};

const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未登录' });
    }
    
    if (req.user.user_type === 'admin') {
      return next();
    }
    
    const hasPermission = req.user.Roles?.some(role => 
      role.Permissions?.some(perm => perm.code === permissionCode)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          include: [{ model: Role, include: [Permission] }]
        });
        
        if (user && user.status === 'active') {
          req.user = user;
        }
      } catch (error) {
        // Token 无效或过期，忽略，继续作为访客
      }
    }
    
    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next();
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requirePermission,
  optionalAuth
};