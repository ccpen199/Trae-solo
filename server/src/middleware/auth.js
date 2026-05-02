const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '未授权，请先登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: '账户已被禁用' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'token已过期' });
    }
    res.status(500).json({ message: '认证失败', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: '无权限访问此资源',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    next();
  };
};

const checkCourseEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const Enrollment = require('../models/Enrollment');
    
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (!enrollment && req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: '您未购买该课程' });
    }

    req.enrollment = enrollment;
    next();
  } catch (error) {
    res.status(500).json({ message: '检查权限失败', error: error.message });
  }
};

module.exports = { auth, authorize, checkCourseEnrollment };
