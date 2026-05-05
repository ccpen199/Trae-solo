const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.status) {
      return res.status(401).json({ success: false, message: '用户不存在或已被禁用' });
    }
    
    req.user = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '令牌已过期' });
    }
    return res.status(403).json({ success: false, message: '无效的令牌' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    next();
  };
};

const isAdmin = requireRole('admin');
const isManager = requireRole('admin', 'manager');
const isOperator = requireRole('admin', 'manager', 'operator');

module.exports = {
  authenticateToken,
  requireRole,
  isAdmin,
  isManager,
  isOperator
};
