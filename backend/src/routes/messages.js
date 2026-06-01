const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', authMiddleware, (req, res) => {
  const conversations = db.prepare(`
    SELECT 
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
      u.nickname,
      u.avatar,
      m.content as last_message,
      m.created_at as last_message_time,
      SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY other_user_id
    ORDER BY last_message_time DESC
  `).all(req.user.userId, req.user.userId, req.user.userId, req.user.userId, req.user.userId);

  res.json(conversations);
});

router.get('/:userId', authMiddleware, (req, res) => {
  const otherUserId = req.params.userId;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const messages = db.prepare(`
    SELECT m.*, u.nickname, u.avatar 
    FROM messages m 
    JOIN users u ON m.sender_id = u.id 
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(req.user.userId, otherUserId, otherUserId, req.user.userId, limit, offset);

  db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?').run(otherUserId, req.user.userId);

  res.json(messages.reverse());
});

router.post('/:userId', authMiddleware, [
  body('content').notEmpty().withMessage('消息内容不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const receiverId = req.params.userId;
  const { content, type = 'text' } = req.body;

  const result = db.prepare(
    'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)'
  ).run(req.user.userId, receiverId, content, type);

  const message = db.prepare(`
    SELECT m.*, u.nickname, u.avatar 
    FROM messages m 
    JOIN users u ON m.sender_id = u.id 
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(message);
});

router.get('/notifications', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(req.user.userId, limit, offset);

  res.json(notifications);
});

router.post('/notifications/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.userId);
  res.json({ success: true });
});

module.exports = router;
