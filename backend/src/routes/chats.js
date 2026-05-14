const express = require('express');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const chats = db.prepare(`
      SELECT 
        c.id,
        c.last_message,
        c.last_message_time,
        u.id as user_id,
        u.nickname,
        u.avatar
      FROM chats c
      JOIN users u ON (c.user1_id = ? AND c.user2_id = u.id) OR (c.user2_id = ? AND c.user1_id = u.id)
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_time DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);

    const chatsWithUnread = chats.map(chat => {
      const { count } = db.prepare(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE chat_id = ? AND sender_id != ? AND is_read = 0
      `).get(chat.id, req.user.id);
      return { ...chat, unread_count: count };
    });

    res.json({ success: true, data: { chats: chatsWithUnread } });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:chatId/messages', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)').get(chatId, req.user.id, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: '聊天不存在' });
    }

    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(chatId, parseInt(limit), offset);

    db.prepare('UPDATE messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ?').run(chatId, req.user.id);

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'view_chat',
      JSON.stringify({ chat_id: chatId }),
      'messages'
    );

    res.json({ success: true, data: { messages: messages.reverse() } });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:userId/start', authMiddleware, (req, res) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: '不能和自己聊天' });
    }

    const user = db.prepare('SELECT id, nickname, avatar FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    let chat = db.prepare(`
      SELECT * FROM chats 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(req.user.id, userId, userId, req.user.id);

    if (!chat) {
      const stmt = db.prepare('INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)');
      const result = stmt.run(req.user.id, userId);
      chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({ success: true, data: { chat_id: chat.id, user } });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:chatId/messages', authMiddleware, (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: '请输入消息内容' });
    }

    const chat = db.prepare('SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)').get(chatId, req.user.id, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: '聊天不存在' });
    }

    const stmt = db.prepare('INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)');
    const result = stmt.run(chatId, req.user.id, content);

    db.prepare('UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?').run(content, chatId);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'send_message',
      JSON.stringify({ chat_id: chatId, message_id: message.id }),
      'messages'
    );

    res.json({ success: true, data: message, message: '发送成功' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
