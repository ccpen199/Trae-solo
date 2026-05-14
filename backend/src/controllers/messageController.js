const db = require('../models/db');

const sendMessage = (req, res) => {
  const userId = req.user.userId;
  const { toUserId, content } = req.body;

  if (!toUserId || !content) {
    return res.status(400).json({
      success: false,
      message: '参数不完整'
    });
  }

  const insertMessage = db.prepare('INSERT INTO messages (from_user_id, to_user_id, content) VALUES (?, ?, ?)');
  const result = insertMessage.run(userId, toUserId, content.trim());

  res.json({
    success: true,
    message: '发送成功',
    data: { messageId: result.lastInsertRowid }
  });
};

const getMessages = (req, res) => {
  const userId = req.user.userId;
  const { targetUserId, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: '请选择聊天对象'
    });
  }

  const getMessages = db.prepare(`
    SELECT m.*, u.nickname, u.avatar
    FROM messages m
    JOIN users u ON m.from_user_id = u.id
    WHERE (m.from_user_id = ? AND m.to_user_id = ?)
       OR (m.from_user_id = ? AND m.to_user_id = ?)
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `);
  const messages = getMessages.all(userId, targetUserId, targetUserId, userId, parseInt(limit), parseInt(offset));

  const markRead = db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE from_user_id = ? AND to_user_id = ?
  `);
  markRead.run(targetUserId, userId);

  res.json({
    success: true,
    data: { messages: messages.reverse(), hasMore: messages.length === limit }
  });
};

const getConversations = (req, res) => {
  const userId = req.user.userId;

  const getConversations = db.prepare(`
    SELECT 
      u.id as user_id, u.nickname, u.avatar,
      m.content as last_message, m.created_at as last_message_time,
      (SELECT COUNT(*) FROM messages 
       WHERE from_user_id = u.id AND to_user_id = ? AND is_read = 0) as unread_count
    FROM messages m
    JOIN users u ON (
      CASE 
        WHEN m.from_user_id = ? THEN m.to_user_id 
        ELSE m.from_user_id 
      END
    ) = u.id
    WHERE m.from_user_id = ? OR m.to_user_id = ?
    GROUP BY u.id
    ORDER BY m.created_at DESC
  `);
  const conversations = getConversations.all(userId, userId, userId, userId);

  res.json({
    success: true,
    data: { conversations }
  });
};

module.exports = { sendMessage, getMessages, getConversations };
