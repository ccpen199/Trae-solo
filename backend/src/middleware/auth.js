const { getUserFromToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }
  
  const token = authHeader.substring(7);
  const user = await getUserFromToken(token);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '令牌无效或已过期'
    });
  }
  
  req.user = user;
  next();
};

const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }
    
    if (user.roles && user.roles.includes('admin')) {
      return next();
    }
    
    if (!user.permissions || !user.permissions.includes(permissionCode)) {
      return res.status(403).json({
        success: false,
        message: `没有权限: ${permissionCode}`
      });
    }
    
    next();
  };
};

const requireRole = (roleCode) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }
    
    if (user.roles && user.roles.includes('admin')) {
      return next();
    }
    
    if (!user.roles || !user.roles.includes(roleCode)) {
      return res.status(403).json({
        success: false,
        message: `需要角色: ${roleCode}`
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  requirePermission,
  requireRole
};
