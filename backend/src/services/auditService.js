const db = require('../database');
const { generateId } = require('../utils/orderGenerator');

const AUDIT_EVENT_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_STATUS_CHANGED: 'order_status_changed',
  RECOGNITION_COMPLETED: 'recognition_completed',
  TRYON_COMPLETED: 'tryon_completed',
  PRODUCT_ADDED: 'product_added',
  PRODUCT_REMOVED: 'product_removed',
  SCREENSHOT_SAVED: 'screenshot_saved',
  ORDER_PLACED: 'order_placed',
  ORDER_APPROVED: 'order_approved',
  ORDER_REJECTED: 'order_rejected',
  ORDER_REVERSED: 'order_reversed',
  TODO_ASSIGNED: 'todo_assigned',
  TODO_COMPLETED: 'todo_completed',
  NOTIFICATION_SENT: 'notification_sent',
  USER_LOGIN: 'user_login',
  PERMISSION_CHECK: 'permission_check',
  MODEL_3D_LOCKED: 'model_3d_locked',
  MODEL_3D_UNLOCKED: 'model_3d_unlocked',
  STOCK_CHECK: 'stock_check',
  STATISTICS_UPDATED: 'statistics_updated'
};

const logAuditEvent = (eventType, options = {}) => {
  const {
    orderId = null,
    operatorId = null,
    operatorName = null,
    operatorRole = null,
    detail = null,
    ipAddress = null
  } = options;

  const id = generateId('audit');
  
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, event_type, order_id, operator_id, operator_name, operator_role, detail, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    eventType,
    orderId,
    operatorId,
    operatorName,
    operatorRole,
    detail ? JSON.stringify(detail) : null,
    ipAddress
  );
};

const getAuditLogs = (filters = {}) => {
  const { orderId, operatorId, eventType, startTime, endTime, limit = 100, offset = 0 } = filters;
  
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  
  if (orderId) {
    sql += ' AND order_id = ?';
    params.push(orderId);
  }
  
  if (operatorId) {
    sql += ' AND operator_id = ?';
    params.push(operatorId);
  }
  
  if (eventType) {
    sql += ' AND event_type = ?';
    params.push(eventType);
  }
  
  if (startTime) {
    sql += ' AND created_at >= ?';
    params.push(startTime);
  }
  
  if (endTime) {
    sql += ' AND created_at <= ?';
    params.push(endTime);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  return db.prepare(sql).all(...params);
};

const getAuditLogsByOrder = (orderId) => {
  return db.prepare(`
    SELECT * FROM audit_logs 
    WHERE order_id = ? 
    ORDER BY created_at DESC
  `).all(orderId);
};

module.exports = {
  AUDIT_EVENT_TYPES,
  logAuditEvent,
  getAuditLogs,
  getAuditLogsByOrder
};
