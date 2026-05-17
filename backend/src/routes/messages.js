const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, runGet, runRun } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await runQuery(`
      SELECT 
        u.id as user_id,
        u.nickname,
        u.avatar,
        m.content as last_message,
        m.created_at as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE from_user_id = u.id AND to_user_id = ? AND is_read = 0) as unread_count
      FROM (
        SELECT from_user_id, to_user_id, MAX(created_at) as max_time
        FROM messages
        WHERE from_user_id = ? OR to_user_id = ?
        GROUP BY 
          CASE WHEN from_user_id < to_user_id THEN from_user_id ELSE to_user_id END,
          CASE WHEN from_user_id < to_user_id THEN to_user_id ELSE from_user_id END
      ) as conv
      JOIN messages m ON (
        (m.from_user_id = conv.from_user_id AND m.to_user_id = conv.to_user_id) OR
        (m.from_user_id = conv.to_user_id AND m.to_user_id = conv.from_user_id)
      ) AND m.created_at = conv.max_time
      JOIN users u ON u.id = CASE WHEN conv.from_user_id = ? THEN conv.to_user_id ELSE conv.from_user_id END
      ORDER BY m.created_at DESC
    `, [userId, userId, userId, userId]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    const otherUserId = req.params.userId;
    const currentUserId = req.user.id;

    const messages = await runQuery(`
      SELECT m.*, 
        from_u.nickname as from_nickname,
        from_u.avatar as from_avatar,
        to_u.nickname as to_nickname,
        to_u.avatar as to_avatar
      FROM messages m
      LEFT JOIN users from_u ON m.from_user_id = from_u.id
      LEFT JOIN users to_u ON m.to_user_id = to_u.id
      WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [currentUserId, otherUserId, otherUserId, currentUserId, parseInt(pageSize), offset]);

    await runRun('UPDATE messages SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ?', [otherUserId, currentUserId]);

    const { total } = await runGet(`
      SELECT COUNT(*) as total FROM messages 
      WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
    `, [currentUserId, otherUserId, otherUserId, currentUserId]);

    res.json({
      success: true,
      data: {
        list: messages.reverse(),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:userId', authMiddleware, [
  body('content').notEmpty().withMessage('消息内容不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { content } = req.body;
    const toUserId = req.params.userId;
    const fromUserId = req.user.id;

    const result = await runRun(`
      INSERT INTO messages (from_user_id, to_user_id, content)
      VALUES (?, ?, ?)
    `, [fromUserId, toUserId, content]);

    const message = await runGet('SELECT * FROM messages WHERE id = ?', [result.lastID]);

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
