const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await query(
      `SELECT 
        CASE WHEN from_id = ? THEN to_id ELSE from_id END as partner_id,
        MAX(created_at) as last_time,
        COUNT(*) as unread
      FROM messages 
      WHERE from_id = ? OR to_id = ?
      GROUP BY partner_id
      ORDER BY last_time DESC`,
      [req.user.id, req.user.id, req.user.id]
    );

    const formattedConversations = [];
    for (const conv of conversations) {
      const partner = await queryOne(
        'SELECT id, nickname, avatar FROM users WHERE id = ?',
        [conv.partner_id]
      );
      const lastMessage = await queryOne(
        `SELECT content, created_at FROM messages 
         WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
         ORDER BY created_at DESC LIMIT 1`,
        [req.user.id, conv.partner_id, conv.partner_id, req.user.id]
      );
      const unread = await queryOne(
        `SELECT COUNT(*) as count FROM messages WHERE from_id = ? AND to_id = ? AND read = 0`,
        [conv.partner_id, req.user.id]
      );

      formattedConversations.push({
        partner_id: conv.partner_id,
        partner: partner,
        last_message: lastMessage?.content || '',
        last_time: lastMessage?.created_at || conv.last_time,
        unread: unread.count
      });
    }

    res.json({ success: true, message: '获取成功', data: formattedConversations });
  } catch (err) {
    console.error('获取会话列表失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.get('/:partnerId', authMiddleware, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const messages = await query(
      `SELECT * FROM messages 
       WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, partnerId, partnerId, req.user.id, parseInt(pageSize), offset]
    );

    await execute(
      `UPDATE messages SET read = 1 WHERE from_id = ? AND to_id = ? AND read = 0`,
      [partnerId, req.user.id]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: messages.reverse()
    });
  } catch (err) {
    console.error('获取消息列表失败:', err);
    res.json({ success: false, message: '获取失败', data: [] });
  }
});

router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { toId, content, type = 'text' } = req.body;

    if (!toId || !content) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    await execute(
      'INSERT INTO messages (id, from_id, to_id, content, type, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, toId, content, type, 0, now]
    );

    res.json({ success: true, message: '发送成功', data: null });
  } catch (err) {
    console.error('发送消息失败:', err);
    res.json({ success: false, message: '发送失败', data: null });
  }
});

module.exports = router;
