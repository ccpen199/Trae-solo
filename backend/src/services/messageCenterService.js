import { db } from '../database/init.js';
import { MESSAGE_TYPES, MAX_MESSAGE_CENTER } from '../utils/constants.js';

class MessageCenterService {
  addMessage(userId, messageType, title, content = '', relatedId = null) {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM message_center WHERE user_id = ?');
    const result = countStmt.get(userId);
    
    if (result.count >= MAX_MESSAGE_CENTER) {
      const deleteStmt = db.prepare(`
        DELETE FROM message_center 
        WHERE id = (SELECT id FROM message_center WHERE user_id = ? ORDER BY created_at ASC LIMIT 1)
      `);
      deleteStmt.run(userId);
    }

    const insertStmt = db.prepare(`
      INSERT INTO message_center (user_id, message_type, related_id, title, content, is_read)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    
    const result2 = insertStmt.run(userId, messageType, relatedId, title, content);
    return result2.lastInsertRowid;
  }

  getMessages(userId, messageType = null, limit = 50) {
    let query = `
      SELECT id, message_type, related_id, title, content, is_read, created_at
      FROM message_center 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (messageType) {
      query += ' AND message_type = ?';
      params.push(messageType);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  getUnreadCount(userId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM message_center WHERE user_id = ? AND is_read = 0');
    const result = stmt.get(userId);
    return result.count;
  }

  markAsRead(userId, messageId = null) {
    if (messageId) {
      const stmt = db.prepare('UPDATE message_center SET is_read = 1 WHERE user_id = ? AND id = ?');
      return stmt.run(userId, messageId);
    } else {
      const stmt = db.prepare('UPDATE message_center SET is_read = 1 WHERE user_id = ?');
      return stmt.run(userId);
    }
  }

  addCallRecordNotification(userId, callSession, isCaller) {
    const statusMap = {
      'answered': isCaller ? '通话已接通' : '已接听来电',
      'rejected': isCaller ? '对方已拒接' : '已拒接来电',
      'missed': isCaller ? '对方未接听' : '未接来电',
      'cancelled': isCaller ? '已取消呼叫' : '对方已取消呼叫',
      'ended': '通话已结束'
    };

    const title = isCaller 
      ? `拨打 ${callSession.callee_name || '用户'}` 
      : `来自 ${callSession.caller_name || '用户'} 的来电`;
    
    const content = statusMap[callSession.status] || '通话结束';

    return this.addMessage(userId, MESSAGE_TYPES.CALL_RECORD, title, content, callSession.id);
  }

  addVideoMessageNotification(userId, message, isSender) {
    const title = isSender 
      ? `发送视频留言` 
      : `收到视频留言`;
    
    const content = isSender 
      ? `已发送给 ${message.receiver_count || 1} 位联系人` 
      : `来自 ${message.sender_name || '用户'} 的视频留言`;

    return this.addMessage(userId, MESSAGE_TYPES.VIDEO_MESSAGE, title, content, message.id);
  }

  addContactChangeNotification(userId, action, contactName) {
    const actionMap = {
      'added': `已添加联系人: ${contactName}`,
      'removed': `已删除联系人: ${contactName}`,
      'auto_added': `自动添加联系人: ${contactName}`
    };

    return this.addMessage(
      userId, 
      MESSAGE_TYPES.CONTACT_CHANGE, 
      '联系人变更', 
      actionMap[action] || '联系人信息变更'
    );
  }

  addCapacityAlert(userId, alertType, current, max) {
    const alertMap = {
      'contacts': '联系人容量即将满',
      'call_records': '通话记录容量即将满',
      'messages': '留言记录容量即将满'
    };

    const title = alertMap[alertType] || '容量告警';
    const content = `当前: ${current}/${max}，请及时清理`;

    return this.addMessage(userId, MESSAGE_TYPES.CAPACITY_ALERT, title, content);
  }
}

export const messageCenterService = new MessageCenterService();
