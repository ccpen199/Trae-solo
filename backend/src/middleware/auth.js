const { verifyToken, buildErrorResponse } = require('../utils');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(
      buildErrorResponse(new Error('未提供认证令牌'), '请先登录')
    );
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json(
      buildErrorResponse(new Error('令牌无效或已过期'), '请重新登录')
    );
  }
  
  req.user = decoded;
  next();
};

const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        buildErrorResponse(new Error('未认证'), '请先登录')
      );
    }
    
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json(
        buildErrorResponse(new Error('权限不足'), '您没有权限执行此操作')
      );
    }
    
    next();
  };
};

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  optionalAuthMiddleware
};
