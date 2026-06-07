
const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { checkRateLimit, logAudit } = require('../middleware/rateLimit');
const { encrypt, decrypt, hashContent } = require('../utils/encryption');

const router = express.Router();

router.get('/conversations', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = db.prepare(`
      SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as user_id,
        u.username as username,
        u.avatar as avatar,
        u.wechat_id as wechat_id,
        MAX(m.created_at) as last_message_time,
        SUM(CASE WHEN m.receiver_id = ? AND m.read_status = 0 THEN 1 ELSE 0 END) as unread_count
      FROM messages m
      JOIN users u ON CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END = u.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY user_id
      ORDER BY last_message_time DESC
    `).all(userId, userId, userId, userId, userId);

    const formattedConversations = conversations.map(conv => {
      let lastMessageContent = null;
      try {
        const lastMsgs = db.prepare(`
          SELECT content_encrypted, iv, content_type 
          FROM messages 
          WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1
        `).get(userId, conv.user_id, conv.user_id, userId);
        
        if (lastMsgs) {
          lastMessageContent = decrypt(lastMsgs.content_encrypted, lastMsgs.iv);
          if (lastMsgs.content_type === 'image') lastMessageContent = '[图片]';
          if (lastMsgs.content_type === 'video') lastMessageContent = '[视频]';
          if (lastMsgs.content_type === 'resume') lastMessageContent = '[简历]';
        }
      } catch (e) {
        lastMessageContent = null;
      }
      
      return {
        ...conv,
        last_message_content: lastMessageContent,
        wechat_verified: conv.wechat_id ? 1 : 0
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (err) {
    console.error('获取会话列表失败:', err);
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

router.get('/:userId', authenticateToken, (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.id;
    const { before, limit = 50 } = req.query;

    let sql = `
      SELECT 
        m.id, m.sender_id, m.receiver_id, m.content_type, m.content_encrypted, 
        m.iv, m.attachments, m.read_status, m.created_at,
        u.username as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) 
              OR (m.sender_id = ? AND m.receiver_id = ?))
    `;
    const params = [currentUserId, otherUserId, otherUserId, currentUserId];

    if (before) {
      sql += ' AND m.id < ?';
      params.push(before);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const messages = db.prepare(sql).all(...params);

    const decryptedMessages = messages.map(msg => {
      try {
        const content = decrypt(msg.content_encrypted, msg.iv);
        return {
          ...msg,
          content: content,
          attachments: msg.attachments ? JSON.parse(msg.attachments) : null
        };
      } catch (e) {
        return {
          ...msg,
          content: '[消息已损坏]',
          attachments: msg.attachments ? JSON.parse(msg.attachments) : null
        };
      }
    });

    db.prepare(`
      UPDATE messages 
      SET read_status = 1 
      WHERE sender_id = ? AND receiver_id = ? AND read_status = 0
    `).run(otherUserId, currentUserId);

    res.json({ messages: decryptedMessages.reverse() });
  } catch (err) {
    console.error('获取消息历史失败:', err);
    res.status(500).json({ error: '获取消息历史失败' });
  }
});

router.post('/',
  authenticateToken,
  checkRateLimit('send_message', 60, 5),
  logAudit('send_message'),
  (req, res) => {
    try {
      const { receiver_id, content, content_type = 'text', attachments } = req.body;
      const senderId = req.user.id;

      if (!receiver_id || !content) {
        return res.status(400).json({ error: '接收者和内容必填' });
      }

      if (!['text', 'rich_text', 'image', 'video', 'resume'].includes(content_type)) {
        return res.status(400).json({ error: '不支持的消息类型' });
      }

      if (senderId === receiver_id) {
        return res.status(400).json({ error: '不能给自己发消息' });
      }

      const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id);
      if (!receiver) {
        return res.status(404).json({ error: '接收者不存在' });
      }

      const { encrypted, iv } = encrypt(content);
      const contentHash = hashContent(content);

      const result = db.prepare(`
        INSERT INTO messages (
          sender_id, receiver_id, content_type, 
          content_encrypted, content_hash, iv, attachments
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        senderId, 
        receiver_id, 
        content_type, 
        encrypted, 
        contentHash, 
        iv, 
        attachments ? JSON.stringify(attachments) : null
      );

      const message = db.prepare(`
        SELECT 
          m.id, m.sender_id, m.receiver_id, m.content_type,
          m.read_status, m.created_at,
          u.username as sender_name, u.avatar as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

      res.json({ 
        message: {
          ...message,
          content: content,
          attachments: attachments || null
        }
      });
    } catch (err) {
      console.error('发送消息失败:', err);
      res.status(500).json({ error: '发送消息失败' });
    }
  }
);

router.get('/unread/count', authenticateToken, (req, res) => {
  try {
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE receiver_id = ? AND read_status = 0
    `).get(req.user.id);

    res.json({ count: count.count });
  } catch (err) {
    console.error('获取未读消息数失败:', err);
    res.status(500).json({ error: '获取未读消息数失败' });
  }
});

module.exports = router;
