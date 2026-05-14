const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead,
  getUnreadCount 
} = require('../services/notificationService');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, unreadOnly } = req.query;
    
    const result = await getUserNotifications(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: '获取通知失败'
    });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: '获取未读数量失败'
    });
  }
});

router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    await markAsRead(req.user.id, id);
    
    res.json({
      success: true,
      message: '已标记为已读'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: '已全部标记为已读'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

module.exports = router;
