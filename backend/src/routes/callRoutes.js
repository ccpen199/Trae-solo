import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { callService } from '../services/callService.js';
import { accountService } from '../services/accountService.js';

const router = Router();

router.get('/history', authenticateToken, (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = callService.getCallHistory(req.user.id, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('获取通话历史错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/active', authenticateToken, (req, res) => {
  try {
    const activeCall = callService.getActiveCall(req.user.id);
    res.json({
      success: true,
      data: activeCall || null
    });
  } catch (error) {
    console.error('获取活跃通话错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.post('/create', authenticateToken, (req, res) => {
  try {
    const { calleeId, calleeCID, callType = 'video' } = req.body;
    let actualCalleeId = calleeId;

    if (calleeCID && !calleeId) {
      const userResult = accountService.findUserByCID(calleeCID);
      if (!userResult.success) {
        return res.json({
          success: false,
          message: '目标用户不存在'
        });
      }
      actualCalleeId = userResult.data.id;
    }

    if (!actualCalleeId) {
      return res.status(400).json({
        success: false,
        message: '请提供目标用户ID或CID'
      });
    }

    if (actualCalleeId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能拨打自己'
      });
    }

    const result = callService.createSession(req.user.id, actualCalleeId, callType);
    res.json(result);
  } catch (error) {
    console.error('创建通话错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

router.get('/:sessionId', authenticateToken, (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = callService.getSessionBySessionId(sessionId);

    if (!session) {
      return res.json({
        success: false,
        message: '通话会话不存在'
      });
    }

    if (session.caller_id !== req.user.id && session.callee_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该通话'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('获取通话详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;
