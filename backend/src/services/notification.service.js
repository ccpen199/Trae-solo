const { getDb } = require('../database/init');
const { generateId, stringifyJSON } = require('../utils/common');

const db = getDb();

const createNotification = (options) => {
  const {
    receiverId,
    receiverType = 'employee',
    type,
    title,
    content,
    relatedType,
    relatedId,
    relatedStep,
  } = options;

  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO notifications (
      id, receiver_id, receiver_type, type, title, content,
      related_type, related_id, related_step, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, receiverId, receiverType, type, title, content,
    relatedType, relatedId, relatedStep, createdAt
  );

  return { id, ...options, createdAt };
};

const getNotifications = (userId, options = {}) => {
  const { isRead, limit = 50, offset = 0 } = options;
  let sql = `
    SELECT n.*, 
           m.name as receiver_name, m.avatar as receiver_avatar
    FROM notifications n
    LEFT JOIN employees m ON n.receiver_id = m.id
    WHERE n.receiver_id = ? AND n.is_deleted = 0
  `;
  const params = [userId];

  if (isRead !== undefined) {
    sql += ' AND n.is_read = ?';
    params.push(isRead ? 1 : 0);
  }

  sql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
};

const getUnreadCount = (userId) => {
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0'
  ).get(userId);
  return row ? row.count : 0;
};

const markAsRead = (notificationId, userId) => {
  const stmt = db.prepare(`
    UPDATE notifications 
    SET is_read = 1, read_at = ?
    WHERE id = ? AND receiver_id = ?
  `);

  stmt.run(new Date().toISOString(), notificationId, userId);
  return { success: true };
};

const markAllAsRead = (userId) => {
  const stmt = db.prepare(`
    UPDATE notifications 
    SET is_read = 1, read_at = ?
    WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0
  `);

  stmt.run(new Date().toISOString(), userId);
  return { success: true };
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
