const db = require('../config/database');
const { generateId } = require('../utils/helpers');

const createMessage = (messageType, title, content, options = {}) => {
  const { targetUserId, targetRole, orderId, vehicleId, exceptionId } = options;
  const messageId = generateId();
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO messages (
      id, message_type, target_role, target_user_id,
      order_id, vehicle_id, exception_id, title, content,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    messageId, messageType, targetRole, targetUserId,
    orderId, vehicleId, exceptionId, title, content,
    'unread', now
  );

  return messageId;
};

const getMessages = (userId, userRole, options = {}) => {
  const { status, limit = 20, offset = 0 } = options;

  let query = `
    SELECT * FROM messages 
    WHERE (target_user_id = ? OR target_role = ?)
  `;
  const params = [userId, userRole];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
};

const getUnreadCount = (userId, userRole) => {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM messages 
    WHERE (target_user_id = ? OR target_role = ?) AND status = 'unread'
  `).get(userId, userRole);
  
  return result?.count || 0;
};

const markAsRead = (messageId, userId, userRole) => {
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE messages 
    SET status = 'read', read_at = ? 
    WHERE id = ? AND (target_user_id = ? OR target_role = ?)
  `).run(now, messageId, userId, userRole);

  return result.changes > 0;
};

module.exports = {
  createMessage,
  getMessages,
  getUnreadCount,
  markAsRead
};
