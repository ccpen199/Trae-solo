const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const insertNotificationStmt = db.prepare(`
  INSERT INTO notifications (id, user_id, title, message, type, entity_type, entity_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const getNotificationsByUserStmt = db.prepare(`
  SELECT * FROM notifications 
  WHERE user_id = ? 
  ORDER BY created_at DESC
  LIMIT 50
`);

const getUnreadCountStmt = db.prepare(`
  SELECT COUNT(*) as count FROM notifications 
  WHERE user_id = ? AND read_at IS NULL
`);

const markAsReadStmt = db.prepare(`
  UPDATE notifications SET read_at = datetime('now')
  WHERE id = ? AND read_at IS NULL
`);

const markAllAsReadStmt = db.prepare(`
  UPDATE notifications SET read_at = datetime('now')
  WHERE user_id = ? AND read_at IS NULL
`);

class NotificationService {
  static async create(userId, title, message, type, entityType, entityId) {
    const id = uuidv4();
    insertNotificationStmt.run(id, userId, title, message, type, entityType, entityId);
    console.log(`[NOTIFICATION] Created for user ${userId}: ${title}`);
    return id;
  }

  static async getByUser(userId) {
    return getNotificationsByUserStmt.all(userId);
  }

  static async getUnreadCount(userId) {
    const result = getUnreadCountStmt.get(userId);
    return result ? result.count : 0;
  }

  static async markAsRead(notificationId) {
    return markAsReadStmt.run(notificationId).changes > 0;
  }

  static async markAllAsRead(userId) {
    return markAllAsReadStmt.run(userId).changes;
  }

  static async broadcastToRole(role, title, message, type, entityType, entityId) {
    const usersStmt = db.prepare("SELECT id FROM users WHERE role = ? AND status = 'active'");
    const users = usersStmt.all(role);
    
    for (const user of users) {
      await this.create(user.id, title, message, type, entityType, entityId);
    }
    return users.length;
  }
}

module.exports = NotificationService;
