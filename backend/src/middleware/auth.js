const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('./errorHandler');
const { logger } = require('../utils/logger');

const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  STREAMER: 'streamer',
  MERCHANT: 'merchant',
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  START_LIVE: 'start_live',
  END_LIVE: 'end_live',
  START_FLASH_SALE: 'start_flash_sale',
  MANAGE_INVENTORY: 'manage_inventory',
  PROCESS_ORDER: 'process_order',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_USERS: 'manage_users',
  PLACE_ORDER: 'place_order',
  VIEW_LIVE: 'view_live'
};

const ROLE_PERMISSIONS = {
  [ROLES.PLATFORM_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.STREAMER]: [
    PERMISSIONS.START_LIVE,
    PERMISSIONS.END_LIVE,
    PERMISSIONS.START_FLASH_SALE,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_LIVE
  ],
  [ROLES.MERCHANT]: [
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.PROCESS_ORDER,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.PLACE_ORDER,
    PERMISSIONS.VIEW_LIVE
  ]
};

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('请先登录', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
      permissions: ROLE_PERMISSIONS[decoded.role] || []
    };

    logger.debug('用户已认证', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('JWT 验证失败:', error);
    return next(new AppError('无效的令牌', 401, 'INVALID_TOKEN'));
  }
});

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('请先登录', 401, 'UNAUTHORIZED'));
    }

    const hasPermission = permissions.every(perm => 
      req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      logger.warn('权限不足', {
        userId: req.user.id,
        role: req.user.role,
        requiredPermissions: permissions,
        path: req.path
      });
      return next(new AppError('权限不足', 403, 'FORBIDDEN'));
    }

    next();
  };
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('请先登录', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('角色权限不足', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
      return next(new AppError('权限不足', 403, 'FORBIDDEN'));
    }

    next();
  };
};

const wsAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('未授权'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username
    };
    next();
  } catch (error) {
    next(new Error('令牌无效'));
  }
};

module.exports = {
  authMiddleware,
  requirePermission,
  requireRole,
  wsAuthMiddleware,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
};
