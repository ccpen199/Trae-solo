const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'token 无效或已过期' });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: '无权限执行此操作' });
    }
    next();
  };
};

const logOperation = (req, action, resourceType, resourceId, oldValue = null, newValue = null) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      req.user.id,
      action,
      resourceType,
      resourceId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      req.ip,
      req.get('User-Agent')
    );
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

module.exports = { authMiddleware, roleMiddleware, logOperation };
