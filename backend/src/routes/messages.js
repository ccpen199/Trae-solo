const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/unread-count', authenticate, (req, res) => {
  try {
    const result = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'order_notification' THEN 1 ELSE 0 END) as order_notifications,
        SUM(CASE WHEN type = 'post_like' THEN 1 ELSE 0 END) as post_likes,
        SUM(CASE WHEN type = 'post_comment' THEN 1 ELSE 0 END) as post_comments,
        COUNT(*) as total
      FROM messages WHERE receiver_id = ? AND is_read = 0
    `).get(req.user.id);

    const chatCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM chat_messages WHERE receiver_id = ? AND is_read = 0
    `).get(req.user.id);

    res.json({
      messages: {
        order_notifications: result.order_notifications || 0,
        post_likes: result.post_likes || 0,
        post_comments: result.post_comments || 0,
        total: result.total || 0
      },
      chat: chatCount.count || 0,
      total: (result.total || 0) + (chatCount.count || 0)
    });
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    res.status(500).json({ error: '获取未读消息数失败' });
  }
});

router.get('/', authenticate, (req, res) => {
  const { type = 'all', page = 1, page_size = 20 } = req.query;
  const pageNum = parseInt(page);
  const pageSize = parseInt(page_size);
  const offset = (pageNum - 1) * pageSize;

  let whereClause = 'WHERE receiver_id = ?';
  const params = [req.user.id];

  if (type !== 'all') {
    whereClause += ' AND type = ?';
    params.push(type);
  }

  try {
    const totalResult = db.prepare(`
      SELECT COUNT(*) as total FROM messages ${whereClause}
    `).get(...params);

    const messages = db.prepare(`
      SELECT m.*, 
             u.id as sender_id, u.real_name as sender_name, u.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({
      messages,
      total: totalResult.total,
      page: pageNum,
      page_size: pageSize
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({ error: '获取消息列表失败' });
  }
});

router.post('/read', authenticate, (req, res) => {
  const { type, ids } = req.body;

  try {
    if (ids && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`
        UPDATE messages SET is_read = 1 WHERE id IN (${placeholders}) AND receiver_id = ?
      `).run(...ids, req.user.id);
    } else if (type) {
      db.prepare(`
        UPDATE messages SET is_read = 1 WHERE type = ? AND receiver_id = ?
      `).run(type, req.user.id);
    } else {
      db.prepare(`
        UPDATE messages SET is_read = 1 WHERE receiver_id = ?
      `).run(req.user.id);
    }

    res.json({ message: '消息已标为已读' });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({ error: '标记消息已读失败' });
  }
});

router.get('/chats', authenticate, (req, res) => {
  try {
    const chats = db.prepare(`
      WITH chat_users AS (
        SELECT 
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
          MAX(created_at) as last_message_at
        FROM chat_messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY other_user_id
      )
      SELECT 
        u.id as user_id, u.real_name as user_name, u.avatar as user_avatar,
        cu.last_message_at,
        (SELECT content FROM chat_messages 
         WHERE (sender_id = ? AND receiver_id = u.id) 
            OR (sender_id = u.id AND receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chat_messages 
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM chat_users cu
      LEFT JOIN users u ON cu.other_user_id = u.id
      ORDER BY cu.last_message_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    res.json({ chats });
  } catch (error) {
    console.error('获取聊天列表失败:', error);
    res.status(500).json({ error: '获取聊天列表失败' });
  }
});

router.get('/chats/:userId', authenticate, (req, res) => {
  const { userId } = req.params;
  const { page = 1, page_size = 50 } = req.query;
  const pageNum = parseInt(page);
  const pageSize = parseInt(page_size);
  const offset = (pageNum - 1) * pageSize;

  try {
    const otherUser = db.prepare('SELECT id, real_name, avatar FROM users WHERE id = ?').get(userId);

    if (!otherUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const totalResult = db.prepare(`
      SELECT COUNT(*) as total FROM chat_messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `).get(req.user.id, userId, userId, req.user.id);

    const messages = db.prepare(`
      SELECT * FROM chat_messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, userId, userId, req.user.id, pageSize, offset);

    db.prepare(`
      UPDATE chat_messages SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(userId, req.user.id);

    res.json({
      user: otherUser,
      messages: messages.reverse(),
      total: totalResult.total,
      page: pageNum,
      page_size: pageSize
    });
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    res.status(500).json({ error: '获取聊天记录失败' });
  }
});

router.post('/chats/:userId', authenticate, [
  body('content').notEmpty().withMessage('消息内容不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.params;
  const { content } = req.body;

  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: '不能给自己发消息' });
  }

  try {
    const otherUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);

    if (!otherUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const insertMessage = db.prepare(`
      INSERT INTO chat_messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `);

    const result = insertMessage.run(req.user.id, userId, content);

    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ error: '发送消息失败，请稍后重试' });
  }
});

router.post('/chats/:userId/read', authenticate, (req, res) => {
  const { userId } = req.params;

  try {
    db.prepare(`
      UPDATE chat_messages SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(userId, req.user.id);

    res.json({ message: '消息已标为已读' });
  } catch (error) {
    console.error('标记聊天已读失败:', error);
    res.status(500).json({ error: '标记聊天已读失败' });
  }
});

module.exports = router;
