require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未登录，请先登录'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        as: 'roles',
        include: [{
          model: Permission,
          as: 'permissions'
        }]
      }]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用'
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      orgId: user.orgId,
      roles: user.roles.map(role => ({
        id: role.id,
        name: role.name,
        code: role.code,
        permissions: role.permissions.map(perm => ({
          id: perm.id,
          name: perm.name,
          code: perm.code,
          type: perm.type,
          path: perm.path
        }))
      }))
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }
    return res.status(401).json({
      code: 401,
      message: '无效的登录凭证'
    });
  }
};

const checkPermission = (permissionCode) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }

    const hasPermission = user.roles.some(role => 
      role.permissions.some(perm => perm.code === permissionCode)
    ) || user.roles.some(role => role.code === 'SUPER_ADMIN');

    if (!hasPermission) {
      return res.status(403).json({
        code: 403,
        message: '无权限访问'
      });
    }

    next();
  };
};

const checkRole = (roleCode) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }

    const hasRole = user.roles.some(role => role.code === roleCode);
    
    if (!hasRole) {
      return res.status(403).json({
        code: 403,
        message: '无权限访问'
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  checkPermission,
  checkRole
};
