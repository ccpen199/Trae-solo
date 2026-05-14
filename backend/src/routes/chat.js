const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 发送消息
router.post('/send', authMiddleware, (req, res) => {
  try {
    const { to_user_id, appliance_id, content } = req.body;

    if (!to_user_id || !content) {
      return res.status(400).json({
        success: false,
        message: '接收用户和消息内容不能为空'
      });
    }

    db.prepare(`
      INSERT INTO chat_messages (from_user_id, to_user_id, appliance_id, content)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, to_user_id, appliance_id, content);

    res.json({
      success: true,
      message: '消息发送成功'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取与特定用户的聊天记录
router.get('/history/:userId', authMiddleware, (req, res) => {
  try {
    const { userId } = req.params;
    const { appliance_id, page = 1, page_size = 50 } = req.query;

    const offset = (page - 1) * page_size;
    const sql = `
      SELECT cm.*, 
             u1.phone as from_user_phone, 
             u1.nickname as from_user_nickname,
             u2.phone as to_user_phone,
             u2.nickname as to_user_nickname
      FROM chat_messages cm
      LEFT JOIN users u1 ON cm.from_user_id = u1.id
      LEFT JOIN users u2 ON cm.to_user_id = u2.id
      WHERE (cm.from_user_id = ? AND cm.to_user_id = ?) OR (cm.from_user_id = ? AND cm.to_user_id = ?)
      ${appliance_id ? 'AND cm.appliance_id = ?' : ''}
      ORDER BY cm.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const params = appliance_id 
      ? [req.user.id, userId, userId, req.user.id, appliance_id, page_size, offset]
      : [req.user.id, userId, userId, req.user.id, page_size, offset];

    const messages = db.prepare(sql).all(...params);

    // 标记消息为已读
    db.prepare(`
      UPDATE chat_messages
      SET is_read = 1
      WHERE to_user_id = ? AND from_user_id = ? AND is_read = 0
    `).run(req.user.id, userId);

    res.json({
      success: true,
      data: messages.reverse(), // 按时间正序返回
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取未读消息数量
router.get('/unread', authMiddleware, (req, res) => {
  try {
    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM chat_messages WHERE to_user_id = ? AND is_read = 0'
    ).get(req.user.id).count;

    res.json({
      success: true,
      data: { unread_count: unreadCount },
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router;
