const jwt = require('jsonwebtoken');
const { cache } = require('../config/redis');
const db = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'student_grade_management_jwt_secret_key_2024';

// JWT认证中间件
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.split(' ')[1];

    // 检查token是否在黑名单中（用于登出功能）
    const isBlacklisted = await cache.get(`blacklist:token:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: '令牌已过期，请重新登录'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 从数据库获取用户信息，确保用户仍存在且状态正常
    const user = await db.User.findOne({
      where: { id: decoded.userId },
      include: [{
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name', 'code']
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.status) {
      return res.status(401).json({
        success: false,
        message: '用户已被禁用'
      });
    }

    // 将用户信息挂载到request对象上
    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      roleCode: user.role?.code,
      roleName: user.role?.name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期，请重新登录'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      });
    }
    return res.status(500).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
};

// 角色权限中间件
const authorizeRole = (...allowedRoles) => {
  return [
    authenticateJWT,
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '未授权访问'
        });
      }

      if (!allowedRoles.includes(req.user.roleCode)) {
        return res.status(403).json({
          success: false,
          message: '权限不足，无法访问此资源'
        });
      }

      next();
    }
  ];
};

// 系统管理员
const isSystemAdmin = authorizeRole('SYSTEM_ADMIN');

// 教学管理员或系统管理员
const isTeachingAdmin = authorizeRole('SYSTEM_ADMIN', 'TEACHING_ADMIN');

// 教师或管理员
const isTeacherOrAdmin = authorizeRole('SYSTEM_ADMIN', 'TEACHING_ADMIN', 'TEACHER');

// 教师或管理员或学生（已认证的用户）
const isAuthenticated = authenticateJWT;

module.exports = {
  authenticateJWT,
  authorizeRole,
  isSystemAdmin,
  isTeachingAdmin,
  isTeacherOrAdmin,
  isAuthenticated
};
