import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { messageService } from '../services/messageService.js';
import { accountService } from '../services/accountService.js';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { type = 'all', limit = 50 } = req.query;
    const result = messageService.getMessages(req.user.id, type, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('获取留言列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/unread-count', authenticateToken, (req, res) => {
  try {
    const count = messageService.getUnreadCount(req.user.id);
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

router.get('/:messageId', authenticateToken, (req, res) => {
  try {
    const { messageId } = req.params;
    const result = messageService.getMessageDetail(req.user.id, messageId);
    res.json(result);
  } catch (error) {
    console.error('获取留言详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverIds, receiverCIDs, textContent, videoUrl, duration = 0 } = req.body;
    let actualReceiverIds = receiverIds || [];

    if (receiverCIDs && receiverCIDs.length > 0) {
      for (const cid of receiverCIDs) {
        const userResult = accountService.findUserByCID(cid);
        if (userResult.success) {
          actualReceiverIds.push(userResult.data.id);
        }
      }
    }

    if (actualReceiverIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供接收方ID或CID'
      });
    }

    actualReceiverIds = [...new Set(actualReceiverIds)];
    actualReceiverIds = actualReceiverIds.filter(id => id !== req.user.id);

    if (actualReceiverIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '不能给自己发送留言'
      });
    }

    const result = await messageService.sendVideoMessage(
      req.user.id,
      actualReceiverIds,
      textContent || '',
      videoUrl || '',
      duration
    );

    res.json(result);
  } catch (error) {
    console.error('发送留言错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.put('/:messageId/read', authenticateToken, (req, res) => {
  try {
    const { messageId } = req.params;
    const result = messageService.markAsRead(messageId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
