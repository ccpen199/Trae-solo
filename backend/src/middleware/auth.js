const jwt = require('jsonwebtoken');
const db = require('../models/database');

const authMiddleware = (requiredPermissions = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(decoded.userId, 'active');
      
      if (!user) {
        return res.status(401).json({ success: false, message: '用户不存在或已禁用' });
      }

      req.user = user;

      if (requiredPermissions.length > 0) {
        const hasPermission = checkPermission(user.role, requiredPermissions);
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: '权限不足' });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: '令牌无效' });
    }
  };
};

const rolePermissions = {
  admin: ['view', 'submit', 'review', 'manage'],
  owner: ['view', 'submit'],
  toll: ['view', 'submit', 'review'],
  operator: ['view', 'submit', 'review', 'manage'],
  finance: ['view', 'review'],
  maintain: ['view', 'manage']
};

const checkPermission = (role, requiredPermissions) => {
  const userPermissions = rolePermissions[role] || [];
  return requiredPermissions.some(p => userPermissions.includes(p));
};

const createOperationLog = (req, action, module, oldValue = null, newValue = null, remark = '') => {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (order_id, user_id, action, module, old_value, new_value, remark, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    req.body?.orderId || null,
    req.user?.id,
    action,
    module,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    remark,
    req.ip
  );
};

const createMessage = (userId, orderId, messageType, title, content, isTodo = false) => {
  const stmt = db.prepare(`
    INSERT INTO messages (user_id, order_id, message_type, title, content, is_todo)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(userId, orderId, messageType, title, content, isTodo ? 1 : 0);
};

const createTimeline = (orderId, eventType, eventTitle, eventContent, operatorId, operatorName, statusFrom, statusTo, remark = '') => {
  const stmt = db.prepare(`
    INSERT INTO timeline (order_id, event_type, event_title, event_content, operator_id, operator_name, status_from, status_to, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(orderId, eventType, eventTitle, eventContent, operatorId, operatorName, statusFrom, statusTo, remark);
};

const getUsersByRole = (role) => {
  return db.prepare('SELECT * FROM users WHERE role = ? AND status = ?').all(role, 'active');
};

const getTollCollectors = () => getUsersByRole('toll');
const getOperators = () => getUsersByRole('operator');
const getFinanceUsers = () => getUsersByRole('finance');

const createException = (orderId, exceptionType, severity, title, description, originalData = null) => {
  const stmt = db.prepare(`
    INSERT INTO exceptions (order_id, exception_type, severity, title, description, original_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    orderId,
    exceptionType,
    severity,
    title,
    description,
    originalData ? JSON.stringify(originalData) : null
  );

  const operators = getOperators();
  operators.forEach(op => {
    createMessage(op.id, orderId, 'exception', '异常通知', `发生${severity === 'high' ? '高' : severity === 'low' ? '低' : ''}级异常: ${title}`, true);
  });
};

module.exports = {
  authMiddleware,
  createOperationLog,
  createMessage,
  createTimeline,
  getTollCollectors,
  getOperators,
  getFinanceUsers,
  createException
};