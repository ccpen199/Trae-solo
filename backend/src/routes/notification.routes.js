const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const NotificationService = require('../services/notification.service');

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { isRead, isCompleted } = req.query;
    
    const notifications = NotificationService.getUserNotifications(
      req.user.id,
      isRead !== undefined ? isRead === 'true' : null,
      isCompleted !== undefined ? isCompleted === 'true' : null
    );
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取通知列表失败',
      error: error.message 
    });
  }
});

router.get('/unread-count', (req, res) => {
  try {
    const count = NotificationService.getUnreadCount(req.user.id);
    const pendingTodoCount = NotificationService.getPendingTodoCount(req.user.id);
    
    res.json({
      success: true,
      data: {
        unreadCount: count,
        pendingTodoCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取未读数量失败',
      error: error.message 
    });
  }
});

router.put('/:id/read', (req, res) => {
  try {
    NotificationService.markAsRead(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: '已标记为已读'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '标记已读失败',
      error: error.message 
    });
  }
});

router.put('/:id/complete', (req, res) => {
  try {
    NotificationService.markAsCompleted(req.params.id, req.user.id);
    
    res.json({
      success: true,
      message: '已标记为已完成'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '标记已完成失败',
      error: error.message 
    });
  }
});

router.put('/read-all', (req, res) => {
  try {
    const notifications = NotificationService.getUserNotifications(req.user.id, false);
    
    notifications.forEach(n => {
      NotificationService.markAsRead(n.id, req.user.id);
    });
    
    res.json({
      success: true,
      message: `已将 ${notifications.length} 条通知标记为已读`,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '批量标记已读失败',
      error: error.message 
    });
  }
});

module.exports = router;
