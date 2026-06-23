import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Message } from '../entities/Message';
import { auth, AuthRequest } from '../middleware/auth';
import { MessageService } from '../services/messageService';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Message);
    const user = req.user!;
    const where: any = { userId: user.id };
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;
    const messages = await repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.get('/unread-count', auth(), async (req: AuthRequest, res, next) => {
  try {
    const messageService = new MessageService(AppDataSource.getRepository(Message));
    const count = await messageService.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(), async (req: AuthRequest, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Message);
    const message = await repo.findOne({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!message) return res.status(404).json({ message: '消息不存在' });
    if (message.status === 'unread') {
      message.status = 'read';
      await repo.save(message);
    }
    res.json(message);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/read', auth(), async (req: AuthRequest, res, next) => {
  try {
    const messageService = new MessageService(AppDataSource.getRepository(Message));
    const msg = await messageService.markAsRead(req.params.id);
    if (!msg) return res.status(404).json({ message: '消息不存在' });
    res.json(msg);
  } catch (err) {
    next(err);
  }
});

router.post('/read-all', auth(), async (req: AuthRequest, res, next) => {
  try {
    const messageService = new MessageService(AppDataSource.getRepository(Message));
    const count = await messageService.markAllAsRead(req.user!.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

router.post('/send', auth(['admin', 'property']), async (req: AuthRequest, res, next) => {
  try {
    const messageService = new MessageService(AppDataSource.getRepository(Message));
    const { userIds, ...payload } = req.body;
    if (Array.isArray(userIds) && userIds.length > 0) {
      const messages = await messageService.batchSend(userIds, payload);
      res.json({ count: messages.length });
    } else {
      res.status(400).json({ message: '请指定接收用户' });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
