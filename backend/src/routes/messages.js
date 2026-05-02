const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const messageService = require('../services/MessageService');

router.post('/consultations/:id/send', authenticateToken, async (req, res) => {
  try {
    const { content, messageType = 'text' } = req.body;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: '消息内容不能为空' 
      });
    }

    const result = await messageService.sendMessage(
      req.params.id,
      req.user.id,
      req.user.role,
      content,
      messageType
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/consultations/:id', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await messageService.getMessages(
      req.params.id,
      req.user.id,
      req.user.role,
      parseInt(limit),
      parseInt(offset)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const result = await messageService.getUnreadCount(req.user.id, req.user.role);
    res.json(result);
  } catch (error) {
    console.error('获取未读消息计数错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/read', authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ 
        success: false, 
        message: '消息ID列表不能为空' 
      });
    }

    const result = await messageService.markAsRead(messageIds, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
