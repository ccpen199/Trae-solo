const express = require('express');
const db = require('../database');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const { NotificationService } = require('../services/NotificationService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, unreadOnly, limit = 50, offset = 0 } = req.query;
    
    const notificationService = new NotificationService();
    
    const notifications = notificationService.getNotifications(req.user.id, {
      status,
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const unreadCount = notificationService.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    logger.error('获取通知列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const notificationService = new NotificationService();
    const count = notificationService.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    logger.error('获取未读通知数量失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/:notificationId', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = db.get(`
      SELECT n.*
      FROM notifications n
      WHERE n.id = ? 
        AND (n.user_id = ? OR n.role_id IN (
          SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = ?
        ))
    `, [notificationId, req.user.id, req.user.id]);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: '通知不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    logger.error('获取通知详情失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notificationService = new NotificationService();
    const result = notificationService.markAsRead(notificationId, req.user.id);
    
    if (result.marked === 0) {
      return res.status(404).json({
        success: false,
        error: '通知不存在'
      });
    }
    
    res.json({
      success: true,
      message: '已标记为已读'
    });
  } catch (error) {
    logger.error('标记通知已读失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/mark-all-read', authenticate, async (req, res) => {
  try {
    const notificationService = new NotificationService();
    const result = notificationService.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      data: {
        markedCount: result.marked
      },
      message: `已将 ${result.marked} 条通知标记为已读`
    });
  } catch (error) {
    logger.error('标记所有通知已读失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
