import { Router, type Request, type Response } from 'express';
import { IMService } from '../services/im.service.js';

const router = Router();

router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    const role = req.query.role as string;

    if (!userId || !role) {
      res.status(400).json({ success: false, error: '缺少必要参数 userId 或 role' });
      return;
    }

    const result = await IMService.getSessionList(userId, role);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取会话列表失败' });
  }
});

router.get('/session/:sessionId/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ success: false, error: '缺少 sessionId 参数' });
      return;
    }

    const result = await IMService.getSessionMessages(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取消息列表失败' });
  }
});

router.post('/session/:sessionId/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { senderId, senderType, content, type } = req.body;

    if (!sessionId || !senderId || !senderType || !content || !type) {
      res.status(400).json({ success: false, error: '缺少必要参数' });
      return;
    }

    const result = await IMService.sendMessage(sessionId, senderId, senderType, content, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '发送消息失败' });
  }
});

router.post('/interview-invite', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, jobId, talentId, hrId, interviewTime, location, notes } = req.body;

    if (!sessionId || !jobId || !talentId || !hrId || !interviewTime || !location) {
      res.status(400).json({ success: false, error: '缺少必要参数' });
      return;
    }

    const result = await IMService.createInterviewInvite(
      sessionId,
      jobId,
      talentId,
      hrId,
      new Date(interviewTime),
      location,
      notes || ''
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '创建面试邀请失败' });
  }
});

router.put('/interview-invite/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      res.status(400).json({ success: false, error: '缺少必要参数 id 或 status' });
      return;
    }

    const result = await IMService.updateInterviewStatus(id, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '更新面试状态失败' });
  }
});

router.get('/interview-invites', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    const role = req.query.role as string;

    if (!userId || !role) {
      res.status(400).json({ success: false, error: '缺少必要参数 userId 或 role' });
      return;
    }

    const result = await IMService.getInterviewInvites(userId, role);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取面试邀请列表失败' });
  }
});

export default router;
