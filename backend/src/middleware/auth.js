const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user || user.status !== 1) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已禁用'
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'token无效'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'token已过期'
      });
    }
    return res.status(500).json({
      success: false,
      message: '认证失败',
      error: error.message
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.userId = null;
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.status === 1) {
      req.user = user;
      req.userId = user.id;
    } else {
      req.userId = null;
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.userId = null;
    req.user = null;
    next();
  }
};

module.exports = {
  auth,
  optionalAuth
};
