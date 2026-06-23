const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const StudentAccount = require('../models/StudentAccount');

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await AdminUser.findById(decoded.id).select('-password');
    
    if (!admin || admin.status !== 'active') {
      return res.status(401).json({ message: '用户不存在或已被禁用' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: '认证令牌无效或已过期' });
  }
};

const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await StudentAccount.findOne({ studentId: decoded.studentId });
    
    if (!student || student.status !== 'active') {
      return res.status(401).json({ message: '账户不存在或已被冻结' });
    }

    req.student = student;
    next();
  } catch (error) {
    res.status(401).json({ message: '认证令牌无效或已过期' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ message: '权限不足' });
    }
    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin || !req.admin.hasPermission(permission)) {
      return res.status(403).json({ message: '权限不足' });
    }
    next();
  };
};

const authenticateDevice = async (req, res, next) => {
  try {
    const deviceId = req.header('X-Device-Id');
    const deviceToken = req.header('X-Device-Token');
    
    if (!deviceId || !deviceToken) {
      return res.status(401).json({ message: '设备认证信息缺失' });
    }

    const Device = require('../models/Device');
    const device = await Device.findOne({ deviceId });
    
    if (!device) {
      return res.status(401).json({ message: '设备不存在' });
    }

    if (device.status === 'fault' || device.status === 'maintenance') {
      return res.status(403).json({ message: '设备处于维护或故障状态' });
    }

    req.device = device;
    next();
  } catch (error) {
    res.status(500).json({ message: '设备认证失败' });
  }
};

module.exports = {
  authenticateAdmin,
  authenticateStudent,
  requireRole,
  requirePermission,
  authenticateDevice
};
