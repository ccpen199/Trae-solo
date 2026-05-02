const express = require('express');
const router = express.Router();
const messageService = require('../services/messageService');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const messages = messageService.getMessages(req.user.id, req.user.role, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: '获取消息列表失败' });
  }
});

router.get('/unread-count', (req, res) => {
  try {
    const count = messageService.getUnreadCount(req.user.id, req.user.role);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: '获取未读消息数失败' });
  }
});

router.post('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const result = messageService.markAsRead(id, req.user.id, req.user.role);
    
    if (!result) {
      return res.status(404).json({ error: '消息不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
});

module.exports = router;
