const { v4: uuidv4 } = require('uuid');
const { get, run, all } = require('../config/database');

class MessageService {
  async sendMessage(consultationId, senderId, senderRole, content, messageType = 'text') {
    const consultation = await get(
      'SELECT * FROM consultations WHERE id = ? AND status = ?',
      [consultationId, 'in_progress']
    );

    if (!consultation) {
      return { success: false, message: '咨询单不存在或当前状态不可发送消息' };
    }

    if (senderRole === 'lawyer') {
      const lawyer = await get('SELECT id FROM lawyers WHERE user_id = ?', [senderId]);
      if (!lawyer || lawyer.id !== consultation.lawyer_id) {
        return { success: false, message: '无权向该咨询单发送消息' };
      }
    } else if (senderRole === 'client') {
      if (consultation.user_id !== senderId) {
        return { success: false, message: '无权向该咨询单发送消息' };
      }
    }

    const messageId = uuidv4();

    await run(`
      INSERT INTO messages (
        id, consultation_id, sender_id, sender_role, content, message_type, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `, [messageId, consultationId, senderId, senderRole, content, messageType]);

    return {
      success: true,
      message: {
        id: messageId,
        consultationId,
        senderId,
        senderRole,
        content,
        messageType,
        isRead: false,
        createdAt: new Date().toISOString()
      }
    };
  }

  async getMessages(consultationId, userId, userRole, limit = 100, offset = 0) {
    const consultation = await get('SELECT * FROM consultations WHERE id = ?', [consultationId]);
    
    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    if (userRole === 'client' && consultation.user_id !== userId) {
      return { success: false, message: '无权查看该咨询单消息' };
    }

    if (userRole === 'lawyer') {
      const lawyer = await get('SELECT id FROM lawyers WHERE user_id = ?', [userId]);
      if (!lawyer || lawyer.id !== consultation.lawyer_id) {
        return { success: false, message: '无权查看该咨询单消息' };
      }
    }

    const messages = await all(`
      SELECT m.*, u.username as sender_name, u.real_name as sender_real_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.consultation_id = ?
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `, [consultationId, limit, offset]);

    const unreadIds = messages
      .filter(m => !m.is_read && m.sender_id !== userId)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      const placeholders = unreadIds.map(() => '?').join(',');
      await run(
        `UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        unreadIds
      );
    }

    const total = await get(
      'SELECT COUNT(*) as count FROM messages WHERE consultation_id = ?',
      [consultationId]
    );

    return {
      success: true,
      messages,
      total: total.count,
      limit,
      offset
    };
  }

  async getUnreadCount(userId, userRole) {
    let condition = '';
    const params = [userId];

    if (userRole === 'lawyer') {
      const lawyer = await get('SELECT id FROM lawyers WHERE user_id = ?', [userId]);
      if (lawyer) {
        condition = `c.lawyer_id = ?`;
        params[0] = lawyer.id;
      }
    } else if (userRole === 'client') {
      condition = `c.user_id = ?`;
    }

    if (!condition) {
      return { success: true, count: 0 };
    }

    const userField = userRole === 'lawyer' ? 'c.lawyer_id' : 'c.user_id';
    const senderCondition = userRole === 'lawyer' ? 'm.sender_role = "client"' : 'm.sender_role = "lawyer"';

    const result = await get(`
      SELECT COUNT(*) as count FROM messages m
      JOIN consultations c ON m.consultation_id = c.id
      WHERE ${condition} AND m.is_read = 0 AND ${senderCondition}
    `, params);

    return {
      success: true,
      count: result.count
    };
  }

  async markAsRead(messageIds, userId) {
    if (!messageIds || messageIds.length === 0) {
      return { success: true, marked: 0 };
    }

    const placeholders = messageIds.map(() => '?').join(',');
    const result = await run(
      `UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE id IN (${placeholders}) AND sender_id != ?`,
      [...messageIds, userId]
    );

    return {
      success: true,
      marked: result.changes
    };
  }
}

module.exports = new MessageService();
