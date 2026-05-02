const jwt = require('jsonwebtoken');
const { get } = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    
    try {
      const dbUser = get('SELECT * FROM users WHERE id = ?', [user.userId]);
      
      if (!dbUser) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      req.user = {
        id: dbUser.id,
        username: dbUser.username,
        role: dbUser.role,
        nickname: dbUser.nickname
      };
      next();
    } catch (dbErr) {
      console.error('数据库查询错误:', dbErr);
      return res.status(500).json({ error: '服务器错误' });
    }
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }
    
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};

const ROLES = {
  DESIGN_OPERATION: 'design_operation',
  CREATOR: 'creator',
  MERCHANT: 'merchant',
  AUDITOR: 'auditor',
  ADMIN: 'admin'
};

const getVisibleOrdersForRole = (role, userId) => {
  switch (role) {
    case ROLES.ADMIN:
      return { condition: '1=1', params: [] };
    case ROLES.DESIGN_OPERATION:
      return { condition: '(creator_id = ? OR assignee_id = ?)', params: [userId, userId] };
    case ROLES.CREATOR:
      return { condition: 'assignee_id = ?', params: [userId] };
    case ROLES.MERCHANT:
      return { condition: 'creator_id = ?', params: [userId] };
    case ROLES.AUDITOR:
      return { condition: 'status IN (?, ?, ?)', params: ['pending_template', 'pending_export', 'published'] };
    default:
      return { condition: '1=0', params: [] };
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  ROLES,
  getVisibleOrdersForRole
};
