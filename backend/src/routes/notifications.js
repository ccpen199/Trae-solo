const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = express.Router();

router.get('/', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const notifications = await NotificationService.getByUser(req.user.id);
    const unreadCount = await NotificationService.getUnreadCount(req.user.id);
    
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: '获取通知失败' });
  }
});

router.get('/unread-count', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: '获取未读数量失败' });
  }
});

router.post('/:notificationId/read', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const success = await NotificationService.markAsRead(req.params.notificationId);
    if (success) {
      res.json({ message: '已标记为已读' });
    } else {
      res.status(404).json({ error: '通知不存在' });
    }
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: '标记已读失败' });
  }
});

router.post('/read-all', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const count = await NotificationService.markAllAsRead(req.user.id);
    res.json({ message: '已标记全部已读', count });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: '标记全部已读失败' });
  }
});

module.exports = router;
