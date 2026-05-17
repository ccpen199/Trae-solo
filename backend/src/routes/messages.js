const express = require('express');
const db = require('../database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', authenticateToken, (req, res) => {
  const conversations = db.prepare(`
    SELECT 
      m.*,
      u.nickname as from_nickname,
      u.avatar as from_avatar,
      u2.nickname as to_nickname,
      u2.avatar as to_avatar
    FROM messages m
    LEFT JOIN users u ON m.from_user_id = u.id
    LEFT JOIN users u2 ON m.to_user_id = u2.id
    WHERE m.id IN (
      SELECT MAX(id)
      FROM messages
      WHERE from_user_id = ? OR to_user_id = ?
      GROUP BY CASE WHEN from_user_id = ? THEN to_user_id ELSE from_user_id END
    )
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id);

  res.json({ success: true, data: conversations });
});

router.get('/history/:userId', authenticateToken, requirePermission('can_send_private_msg'), (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  const messages = db.prepare(`
    SELECT m.*, u.nickname, u.avatar
    FROM messages m
    LEFT JOIN users u ON m.from_user_id = u.id
    WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?)
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, userId, userId, req.user.id, parseInt(pageSize), offset);

  db.prepare('UPDATE messages SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ?').run(userId, req.user.id);

  res.json({ success: true, data: messages.reverse() });
});

router.post('/send/:userId', authenticateToken, requirePermission('can_send_private_msg'), (req, res) => {
  const { userId } = req.params;
  const { content, type = 'text' } = req.body;

  if (!content || content.length > 500) {
    return res.status(400).json({ success: false, message: '消息内容在1-500字之间' });
  }

  const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  db.prepare('INSERT INTO messages (from_user_id, to_user_id, content, type) VALUES (?, ?, ?, ?)').run(req.user.id, userId, content, type);

  res.json({ success: true, message: '发送成功' });
});

router.get('/notifications', authenticateToken, (req, res) => {
  const { type, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE user_id = ?';
  const params = [req.user.id];

  if (type) {
    whereClause += ' AND type = ?';
    params.push(type);
  }

  const notifications = db.prepare(`
    SELECT * FROM notifications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);

  res.json({
    success: true,
    data: {
      list: notifications,
      unreadCount: unreadCount.count
    }
  });
});

router.post('/read-notification/:id', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true, message: '已标记为已读' });
});

router.get('/unread-count', authenticateToken, (req, res) => {
  const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE to_user_id = ? AND is_read = 0').get(req.user.id);
  const notificationCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);

  res.json({
    success: true,
    data: {
      messages: messageCount.count,
      notifications: notificationCount.count,
      total: messageCount.count + notificationCount.count
    }
  });
});

module.exports = router;
