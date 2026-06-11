import { Router, Request, Response } from 'express';
import messageService from '../services/message.service.js';
import authMiddleware from '../middleware/auth.middleware.js';
import auditMiddleware from '../middleware/audit.middleware.js';
import { MessageCreateRequest } from '../../shared/types.js';

const router = Router();

router.get('/conversations', authMiddleware, async (req: Request, res: Response) => {
  const result = await messageService.getConversations(req.user!.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  const result = await messageService.getUnreadCount(req.user!.id);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.get('/task/:taskId', authMiddleware, async (req: Request, res: Response) => {
  const result = await messageService.getMessages(
    Number(req.params.taskId),
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

router.post('/task/:taskId', authMiddleware, auditMiddleware('send_message', 'message'), async (req: Request, res: Response) => {
  const result = await messageService.sendMessage(
    Number(req.params.taskId),
    req.body as MessageCreateRequest,
    req.user!.id
  );
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

export default router;
