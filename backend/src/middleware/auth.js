const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const Role = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  CLASS_MONITOR: 'CLASS_MONITOR',
  STUDENT: 'STUDENT'
};

const LeaveStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXTENDING: 'EXTENDING',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
};

const LeaveType = {
  PERSONAL: 'PERSONAL',
  SICK: 'SICK',
  BUSINESS: 'BUSINESS',
  OTHER: 'OTHER'
};

const AnnouncementType = {
  DEPARTMENT: 'DEPARTMENT',
  CLASS: 'CLASS',
  REMINDER: 'REMINDER'
};

const FeedbackStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

const EvaluationType = {
  MORAL: 'MORAL',
  INTELLECTUAL: 'INTELLECTUAL',
  PHYSICAL: 'PHYSICAL',
  AESTHETIC: 'AESTHETIC',
  LABOR: 'LABOR'
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期'
      });
    }
    res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

const requireAdmin = requireRole(Role.ADMIN);
const requireTeacher = requireRole(Role.TEACHER, Role.ADMIN);
const requireMonitor = requireRole(Role.CLASS_MONITOR, Role.TEACHER, Role.ADMIN);
const requireStudent = requireRole(Role.STUDENT, Role.CLASS_MONITOR, Role.TEACHER, Role.ADMIN);

module.exports = {
  authenticate,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireMonitor,
  requireStudent,
  Role,
  LeaveStatus,
  LeaveType,
  AnnouncementType,
  FeedbackStatus,
  EvaluationType
};
