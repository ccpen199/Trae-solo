const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const NotificationService = require('../services/notification.service');

router.get('/', authenticateToken, (req, res) => {
  try {
    const { limit = 20, unread_only = false } = req.query;
    const userId = req.user.id;

    let whereClauses = ['user_id = ?'];
    const params = [userId];

    if (unread_only === 'true') {
      whereClauses.push('is_read = 0');
    }

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ?
    `).all(...params, parseInt(limit));

    const unreadCount = NotificationService.getUserUnreadCount(userId);

    res.json({
      data: notifications,
      unread_count: unreadCount
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: '获取通知失败' });
  }
});

router.get('/count', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const count = NotificationService.getUserUnreadCount(userId);

    res.json({ unread_count: count });
  } catch (err) {
    console.error('Get notification count error:', err);
    res.status(500).json({ error: '获取通知计数失败' });
  }
});

router.put('/:notificationId/read', authenticateToken, (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(notificationId, req.user.id);
    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    NotificationService.markAsRead(notificationId);

    res.json({ message: '通知已标记为已读' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: '标记已读失败' });
  }
});

router.put('/read-all', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_time = datetime('now') 
      WHERE user_id = ? AND is_read = 0
    `).run(userId);

    res.json({ message: '所有通知已标记为已读' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: '标记已读失败' });
  }
});

module.exports = router;
