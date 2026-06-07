const { db } = require('../models/database');

function sendMessage(req, res) {
  const { receiverId, type, content, videoId } = req.body;

  if (!receiverId || !type) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  if (!['text', 'video'].includes(type)) {
    return res.status(400).json({ error: '无效的消息类型' });
  }

  if (type === 'text' && !content) {
    return res.status(400).json({ error: '文本消息内容不能为空' });
  }

  if (type === 'video' && !videoId) {
    return res.status(400).json({ error: '视频消息需要提供视频ID' });
  }

  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiverId);
  if (!receiver) {
    return res.status(404).json({ error: '接收者不存在' });
  }

  const insertMessage = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, type, content, video_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertMessage.run(req.user.id, receiverId, type, content || null, videoId || null);

  const message = db.prepare(`
    SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.json({ message });
}

function getConversation(req, res) {
  const { otherUserId } = req.params;

  const messages = db.prepare(`
    SELECT m.*, u.username as sender_name, u.avatar as sender_avatar,
           v.file_path as video_path, v.status as video_status
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN videos v ON m.video_id = v.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(req.user.id, otherUserId, otherUserId, req.user.id);

  db.prepare(`
    UPDATE messages 
    SET is_read = 1 
    WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
  `).run(otherUserId, req.user.id);

  res.json({ messages });
}

function getConversations(req, res) {
  const conversations = db.prepare(`
    SELECT 
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
      u.username as other_user_name,
      u.avatar as other_user_avatar,
      u.role as other_user_role,
      MAX(m.created_at) as last_message_time,
      SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count,
      (SELECT content FROM messages 
       WHERE (sender_id = m.sender_id AND receiver_id = m.receiver_id) 
          OR (sender_id = m.receiver_id AND receiver_id = m.sender_id)
       ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT type FROM messages 
       WHERE (sender_id = m.sender_id AND receiver_id = m.receiver_id) 
          OR (sender_id = m.receiver_id AND receiver_id = m.sender_id)
       ORDER BY created_at DESC LIMIT 1) as last_message_type
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY other_user_id
    ORDER BY last_message_time DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  res.json({ conversations });
}

function getUnreadCount(req, res) {
  const count = db.prepare(`
    SELECT COUNT(*) as count 
    FROM messages 
    WHERE receiver_id = ? AND is_read = 0
  `).get(req.user.id);

  res.json({ unreadCount: count.count });
}

module.exports = { sendMessage, getConversation, getConversations, getUnreadCount };
