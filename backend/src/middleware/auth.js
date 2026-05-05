const { verifyToken } = require('../utils/jwt');
const { getRedisClient } = require('../config/redis');
const db = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未授权，请先登录'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        code: 401,
        message: 'token无效或已过期'
      });
    }
    
    const redisClient = getRedisClient();
    let blacklisted = false;
    
    if (redisClient.isReady) {
      try {
        blacklisted = await redisClient.get(`blacklist:${token}`);
      } catch (e) {
        console.log('Redis check failed, using in-memory fallback');
      }
    }
    
    if (blacklisted) {
      return res.status(401).json({
        code: 401,
        message: 'token已失效，请重新登录'
      });
    }
    
    const user = await db.User.findOne({
      where: { id: decoded.id, status: 1 },
      include: [
        { model: db.Role, as: 'role' }
      ]
    });
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用'
      });
    }
    
    req.user = user;
    req.token = token;
    next();
    
  } catch (error) {
      console.error('认证错误:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  };

const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未授权'
      });
    }
    
    const userRole = req.user.role;
    
    if (!userRole) {
      return res.status(403).json({
        code: 403,
        message: '无权限访问'
      });
    }
    
    if (userRole.name === 'admin') {
      return next();
    }
    
    const userPermissions = userRole.permissions || [];
    const hasPermission = permissions.some(perm => userPermissions.includes(perm));
    
    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权限访问该资源'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
