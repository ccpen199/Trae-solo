const db = require('../database');
const { generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');

const NOTIFICATION_TYPES = {
  TODO_ASSIGNED: 'todo_assigned',
  ORDER_STATUS_CHANGED: 'order_status_changed',
  RECOGNITION_READY: 'recognition_ready',
  TRYON_COMPLETED: 'tryon_completed',
  APPROVAL_NEEDED: 'approval_needed',
  APPROVAL_RESULT: 'approval_result',
  STOCK_ALERT: 'stock_alert',
  SYSTEM_MESSAGE: 'system_message'
};

const createNotification = (options) => {
  const {
    userId,
    userRole,
    orderId = null,
    title,
    content = null,
    type = NOTIFICATION_TYPES.SYSTEM_MESSAGE,
    operatorId = null,
    operatorName = null,
    operatorRole = null
  } = options;

  const id = generateId('notif');
  
  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, user_role, order_id, title, content, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, userId, userRole, orderId, title, content, type);
  
  logAuditEvent(AUDIT_EVENT_TYPES.NOTIFICATION_SENT, {
    orderId,
    operatorId,
    operatorName,
    operatorRole,
    detail: { notificationId: id, title, type, userId }
  });

  return { id, ...options };
};

const createNotificationsForRoles = (options) => {
  const {
    roles,
    storeId = null,
    brandId = null,
    orderId = null,
    title,
    content = null,
    type = NOTIFICATION_TYPES.SYSTEM_MESSAGE,
    operatorId = null,
    operatorName = null,
    operatorRole = null
  } = options;

  let sql = 'SELECT id, role, name FROM users WHERE role IN (' + roles.map(() => '?').join(',') + ')';
  const params = [...roles];

  if (storeId) {
    sql += ' AND store_id = ?';
    params.push(storeId);
  }

  if (brandId) {
    sql += ' AND brand_id = ?';
    params.push(brandId);
  }

  const users = db.prepare(sql).all(...params);
  
  const notifications = [];
  for (const user of users) {
    const notification = createNotification({
      userId: user.id,
      userRole: user.role,
      orderId,
      title,
      content: content || title,
      type,
      operatorId,
      operatorName,
      operatorRole
    });
    notifications.push(notification);
  }

  return notifications;
};

const getUserNotifications = (userId, options = {}) => {
  const { isRead = null, limit = 50, offset = 0 } = options;
  
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];
  
  if (isRead !== null) {
    sql += ' AND is_read = ?';
    params.push(isRead ? 1 : 0);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  return db.prepare(sql).all(...params);
};

const markNotificationAsRead = (notificationId, userId) => {
  const stmt = db.prepare(`
    UPDATE notifications 
    SET is_read = 1, read_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `);
  
  const result = stmt.run(notificationId, userId);
  return result.changes > 0;
};

const getUnreadCount = (userId) => {
  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE user_id = ? AND is_read = 0
  `).get(userId);
  
  return result.count;
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  createNotificationsForRoles,
  getUserNotifications,
  markNotificationAsRead,
  getUnreadCount
};
