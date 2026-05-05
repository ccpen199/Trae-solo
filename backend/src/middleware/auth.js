const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: '无权限访问，Token无效或已过期'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '无权限访问，请先登录'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
    } catch (error) {
      req.user = null;
    }
  }
  next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: '无权限访问，需要管理员权限'
    });
  }
};

module.exports = { protect, optionalAuth, admin };
