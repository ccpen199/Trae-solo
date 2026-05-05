import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { MAX_MESSAGE_RECORDS, MAX_GROUP_MESSAGE_USERS, RELATION_SOURCES } from '../utils/constants.js';
import { contactService } from './contactService.js';
import { messageCenterService } from './messageCenterService.js';

class MessageService {
  async sendVideoMessage(senderId, receiverIds, textContent = '', videoUrl = '', duration = 0) {
    if (receiverIds.length > MAX_GROUP_MESSAGE_USERS) {
      return {
        success: false,
        message: `群发人数不能超过${MAX_GROUP_MESSAGE_USERS}人`
      };
    }

    const checkResult = contactService.checkCanSendMessage(senderId, receiverIds);
    
    if (!checkResult.allCanSend) {
      const failed = checkResult.results.filter(r => !r.canSend);
      return {
        success: false,
        message: failed[0].reason || '部分接收方无法接收留言',
        code: 'PARTIAL_FAILURE',
        failedReceivers: failed
      };
    }

    const isGroup = receiverIds.length > 1;
    const messageId = uuidv4();
    const receiverIdsStr = JSON.stringify(receiverIds);

    const insertStmt = db.prepare(`
      INSERT INTO video_messages (
        message_id, sender_id, receiver_ids, text_content, video_url, duration, is_group
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      messageId,
      senderId,
      receiverIdsStr,
      textContent,
      videoUrl,
      duration,
      isGroup ? 1 : 0
    );

    this.cleanupOldRecords(senderId);

    const senderInfo = db.prepare('SELECT id, cid, username, avatar FROM accounts WHERE id = ?').get(senderId);

    for (const receiverId of receiverIds) {
      const receiverResult = checkResult.results.find(r => r.receiverId === receiverId);
      
      if (receiverResult.autoAddStrategy === 'both' || receiverResult.autoAddStrategy === 'caller_only') {
        contactService.tryAutoAddContact(senderId, receiverId, RELATION_SOURCES.VIDEO_MESSAGE);
      }
      if (receiverResult.autoAddStrategy === 'both' || receiverResult.autoAddStrategy === 'target_only') {
        contactService.tryAutoAddContact(receiverId, senderId, RELATION_SOURCES.VIDEO_MESSAGE);
      }

      messageCenterService.addVideoMessageNotification(receiverId, {
        id: result.lastInsertRowid,
        sender_name: senderInfo?.username || senderInfo?.cid,
        receiver_count: receiverIds.length
      }, false);
    }

    messageCenterService.addVideoMessageNotification(senderId, {
      id: result.lastInsertRowid,
      receiver_count: receiverIds.length
    }, true);

    return {
      success: true,
      message: '发送成功',
      data: {
        messageId,
        id: result.lastInsertRowid,
        receiverCount: receiverIds.length
      }
    };
  }

  cleanupOldRecords(userId) {
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM video_messages 
      WHERE sender_id = ? OR receiver_ids LIKE ?
    `);
    const result = countStmt.get(userId, `%"${userId}"%`);

    if (result.count > MAX_MESSAGE_RECORDS) {
      const deleteStmt = db.prepare(`
        DELETE FROM video_messages 
        WHERE id IN (
          SELECT id FROM video_messages 
          WHERE sender_id = ? OR receiver_ids LIKE ?
          ORDER BY created_at ASC 
          LIMIT ?
        )
      `);
      deleteStmt.run(userId, `%"${userId}"%`, result.count - MAX_MESSAGE_RECORDS);
    }
  }

  getMessages(userId, type = 'all', limit = 50) {
    let query = `
      SELECT 
        vm.id, vm.message_id, vm.sender_id, vm.receiver_ids, vm.text_content,
        vm.video_url, vm.duration, vm.is_read, vm.is_group, vm.created_at,
        a.cid as sender_cid, a.username as sender_name, a.avatar as sender_avatar
      FROM video_messages vm
      JOIN accounts a ON vm.sender_id = a.id
    `;
    
    let params = [];
    let conditions = [];

    if (type === 'sent') {
      conditions.push('vm.sender_id = ?');
      params.push(userId);
    } else if (type === 'received') {
      conditions.push('vm.receiver_ids LIKE ?');
      params.push(`%"${userId}"%`);
    } else {
      conditions.push('(vm.sender_id = ? OR vm.receiver_ids LIKE ?)');
      params.push(userId, `%"${userId}"%`);
    }

    query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY vm.created_at DESC LIMIT ?';
    params.push(limit);

    const messages = db.prepare(query).all(...params);

    const formattedMessages = messages.map(msg => {
      let receiverIds = [];
      try {
        receiverIds = JSON.parse(msg.receiver_ids);
      } catch (e) {}

      return {
        ...msg,
        receiver_ids: receiverIds,
        is_sent: msg.sender_id === userId
      };
    });

    return { success: true, data: formattedMessages };
  }

  getMessageDetail(userId, messageId) {
    const message = db.prepare(`
      SELECT 
        vm.*,
        a.cid as sender_cid, a.username as sender_name, a.avatar as sender_avatar
      FROM video_messages vm
      JOIN accounts a ON vm.sender_id = a.id
      WHERE vm.message_id = ?
    `).get(messageId);

    if (!message) {
      return { success: false, message: '留言不存在' };
    }

    let receiverIds = [];
    try {
      receiverIds = JSON.parse(message.receiver_ids);
    } catch (e) {}

    const canAccess = message.sender_id === userId || receiverIds.includes(userId);
    if (!canAccess) {
      return { success: false, message: '无权访问该留言' };
    }

    if (message.sender_id !== userId && !message.is_read) {
      db.prepare('UPDATE video_messages SET is_read = 1 WHERE message_id = ?').run(messageId);
    }

    return {
      success: true,
      data: {
        ...message,
        receiver_ids: receiverIds,
        is_sent: message.sender_id === userId
      }
    };
  }

  markAsRead(messageId, userId) {
    const message = db.prepare(`
      SELECT sender_id, receiver_ids FROM video_messages WHERE message_id = ?
    `).get(messageId);

    if (!message) {
      return { success: false, message: '留言不存在' };
    }

    if (message.sender_id === userId) {
      return { success: true, message: '发送者无需标记已读' };
    }

    db.prepare('UPDATE video_messages SET is_read = 1 WHERE message_id = ?').run(messageId);

    return { success: true, message: '已标记为已读' };
  }

  getUnreadCount(userId) {
    const messages = db.prepare(`
      SELECT id, receiver_ids FROM video_messages 
      WHERE sender_id != ? AND is_read = 0
    `).all(userId);

    let count = 0;
    for (const msg of messages) {
      try {
        const receiverIds = JSON.parse(msg.receiver_ids);
        if (receiverIds.includes(userId)) {
          count++;
        }
      } catch (e) {}
    }

    return count;
  }
}

export const messageService = new MessageService();
