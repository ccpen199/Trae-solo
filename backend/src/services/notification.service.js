const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const NotificationService = {
  create: (userId, mainOrderId, notificationType, title, content, priority = 'normal', actionUrl = null) => {
    const stmt = db.prepare(`
      INSERT INTO notifications (
        id, user_id, main_order_id, notification_type, title, content, priority, action_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(uuidv4(), userId, mainOrderId, notificationType, title, content, priority, actionUrl);
  },

  createTodo: (userId, mainOrderId, title, content) => {
    return NotificationService.create(
      userId, mainOrderId, 'todo', 
      title, content, 'high',
      `/orders/${mainOrderId}`
    );
  },

  markAsRead: (notificationId, userId) => {
    const stmt = db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `);
    return stmt.run(notificationId, userId);
  },

  markAsCompleted: (notificationId, userId) => {
    const stmt = db.prepare(`
      UPDATE notifications 
      SET is_completed = 1, completed_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `);
    return stmt.run(notificationId, userId);
  },

  getUserNotifications: (userId, isRead = null, isCompleted = null) => {
    let sql = `
      SELECT n.*, 
        mo.order_no,
        mo.status as order_status,
        mo.status_display as order_status_display
      FROM notifications n
      LEFT JOIN main_orders mo ON n.main_order_id = mo.id
      WHERE n.user_id = ?
    `;
    const params = [userId];
    
    if (isRead !== null) {
      sql += ' AND n.is_read = ?';
      params.push(isRead ? 1 : 0);
    }
    if (isCompleted !== null) {
      sql += ' AND n.is_completed = ?';
      params.push(isCompleted ? 1 : 0);
    }
    
    sql += ' ORDER BY n.created_at DESC';
    
    return db.prepare(sql).all(...params);
  },

  getUnreadCount: (userId) => {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId);
    return result.count;
  },

  getPendingTodoCount: (userId) => {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND notification_type = 'todo' AND is_completed = 0
    `).get(userId);
    return result.count;
  },

  cancelTodoByOrder: (mainOrderId) => {
    return db.prepare(`
      UPDATE notifications 
      SET is_completed = 1, completed_at = CURRENT_TIMESTAMP 
      WHERE main_order_id = ? AND notification_type = 'todo' AND is_completed = 0
    `).run(mainOrderId);
  }
};

module.exports = NotificationService;
