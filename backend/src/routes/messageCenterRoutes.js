import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { messageCenterService } from '../services/messageCenterService.js';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { messageType, limit = 50 } = req.query;
    const messages = messageCenterService.getMessages(
      req.user.id,
      messageType,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('获取消息中心错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/unread-count', authenticateToken, (req, res) => {
  try {
    const count = messageCenterService.getUnreadCount(req.user.id);
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取未读数量错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.put('/read', authenticateToken, (req, res) => {
  try {
    const { messageId } = req.body;
    
    if (messageId) {
      messageCenterService.markAsRead(req.user.id, messageId);
    } else {
      messageCenterService.markAsRead(req.user.id);
    }

    res.json({
      success: true,
      message: messageId ? '已标记为已读' : '全部已标记为已读'
    });
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
