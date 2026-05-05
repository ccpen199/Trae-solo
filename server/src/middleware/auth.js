const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const logger = require('../config/logger');
require('dotenv').config();

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: '未提供认证令牌' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await pool.query(
      `SELECT u.*, 
              array_agg(DISTINCT r.code) as roles,
              array_agg(DISTINCT p.code) as permissions
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE u.id = $1 AND u.status = 1
       GROUP BY u.id`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在或已被禁用' 
      });
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      email: user.email,
      roles: user.roles.filter(r => r !== null),
      permissions: user.permissions.filter(p => p !== null),
      isRoot: user.roles.includes('root') || user.permissions.includes('root')
    };

    logger.info(`用户 ${user.username} 认证成功，权限: ${req.user.permissions.length} 个`);
    next();
  } catch (error) {
    logger.error('JWT认证失败:', error);
    return res.status(401).json({ 
      success: false, 
      message: '令牌无效或已过期' 
    });
  }
};

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户未登录' 
      });
    }

    if (req.user.isRoot) {
      return next();
    }

    if (req.user.permissions.includes(requiredPermission)) {
      return next();
    }

    try {
      const permResult = await pool.query(
        `SELECT depends_on FROM permissions WHERE code = $1`,
        [requiredPermission]
      );

      if (permResult.rows.length > 0 && permResult.rows[0].depends_on) {
        const depPermResult = await pool.query(
          `SELECT code FROM permissions WHERE id = $1`,
          [permResult.rows[0].depends_on]
        );
        
        if (depPermResult.rows.length > 0 && req.user.permissions.includes(depPermResult.rows[0].code)) {
          return next();
        }
      }
    } catch (err) {
      logger.error('检查权限依赖关系失败:', err);
    }

    logger.warn(`用户 ${req.user.username} 尝试访问无权限资源: ${requiredPermission}`);
    return res.status(403).json({ 
      success: false, 
      message: '无权限访问此资源' 
    });
  };
};

const checkAnyPermission = (permissionList) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户未登录' 
      });
    }

    if (req.user.isRoot) {
      return next();
    }

    for (const perm of permissionList) {
      if (req.user.permissions.includes(perm)) {
        return next();
      }
    }

    logger.warn(`用户 ${req.user.username} 无所需权限中的任何一个: ${permissionList.join(', ')}`);
    return res.status(403).json({ 
      success: false, 
      message: '无权限访问此资源' 
    });
  };
};

const checkAllPermissions = (permissionList) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户未登录' 
      });
    }

    if (req.user.isRoot) {
      return next();
    }

    for (const perm of permissionList) {
      if (!req.user.permissions.includes(perm)) {
        logger.warn(`用户 ${req.user.username} 缺少必需权限: ${perm}`);
        return res.status(403).json({ 
          success: false, 
          message: '无权限访问此资源' 
        });
      }
    }

    return next();
  };
};

module.exports = {
  authenticateJWT,
  checkPermission,
  checkAnyPermission,
  checkAllPermissions
};
