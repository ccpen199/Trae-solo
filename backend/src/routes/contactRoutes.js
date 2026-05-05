import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { contactService } from '../services/contactService.js';
import { accountService } from '../services/accountService.js';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { isFavorite, isRecent, search } = req.query;
    
    const options = {
      isFavorite: isFavorite === 'true',
      isRecent: isRecent === 'true',
      search
    };

    const result = contactService.getContactList(req.user.id, options);
    res.json(result);
  } catch (error) {
    console.error('获取联系人列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/capacity', authenticateToken, (req, res) => {
  try {
    const capacity = contactService.checkCapacity(req.user.id);
    res.json({
      success: true,
      data: capacity
    });
  } catch (error) {
    console.error('获取容量信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/:contactId', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const result = contactService.getContactDetail(req.user.id, parseInt(contactId));
    res.json(result);
  } catch (error) {
    console.error('获取联系人详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { contactCID, contactId } = req.body;
    let targetId = contactId;

    if (contactCID && !contactId) {
      const userResult = accountService.findUserByCID(contactCID);
      if (!userResult.success) {
        return res.json(userResult);
      }
      targetId = userResult.data.id;
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: '请提供联系人ID或CID'
      });
    }

    const result = contactService.addContact(req.user.id, targetId);
    res.json(result);
  } catch (error) {
    console.error('添加联系人错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.delete('/:contactId', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const result = contactService.removeContact(req.user.id, parseInt(contactId));
    res.json(result);
  } catch (error) {
    console.error('删除联系人错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.put('/:contactId/favorite', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const result = contactService.toggleFavorite(req.user.id, parseInt(contactId));
    res.json(result);
  } catch (error) {
    console.error('切换收藏状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/check-call', authenticateToken, (req, res) => {
  try {
    const { targetId, targetCID } = req.body;
    let actualTargetId = targetId;

    if (targetCID && !targetId) {
      const userResult = accountService.findUserByCID(targetCID);
      if (!userResult.success) {
        return res.json({
          success: false,
          message: '目标用户不存在'
        });
      }
      actualTargetId = userResult.data.id;
    }

    if (!actualTargetId) {
      return res.status(400).json({
        success: false,
        message: '请提供目标用户ID或CID'
      });
    }

    const result = contactService.checkCanCall(req.user.id, actualTargetId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('检查通话权限错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/check-message', authenticateToken, (req, res) => {
  try {
    const { receiverIds, receiverCIDs } = req.body;
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

    const result = contactService.checkCanSendMessage(req.user.id, actualReceiverIds);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('检查留言权限错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
