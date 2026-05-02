const jwt = require('jsonwebtoken');
const { get } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'legal-consultation-jwt-secret-key-2024';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: '账户已被禁用' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      realName: user.real_name
    };

    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '令牌无效或已过期' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: '无权限访问该资源',
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

const requireClient = requireRole('client');
const requireLawyer = requireRole('lawyer');
const requireSupport = requireRole('support');
const requireFinance = requireRole('finance');
const requireAdmin = requireRole('admin', 'support', 'finance');
const requireLawyerOrSupport = requireRole('lawyer', 'support');

module.exports = {
  authenticateToken,
  requireRole,
  requireClient,
  requireLawyer,
  requireSupport,
  requireFinance,
  requireAdmin,
  requireLawyerOrSupport
};
