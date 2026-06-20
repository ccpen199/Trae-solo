import { Router, Request, Response } from 'express';
import { messageService } from '../services/message.service';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/error';
import type { MessageType } from '../../../shared/types';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { type, isRead, page, pageSize } = req.query;

    const result = messageService.list({
      userId: req.user.userId,
      role: req.user.role,
      outletId: req.user.outletId,
      type: type as MessageType,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: result.list,
        total: result.total,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', authMiddleware, (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const message = messageService.markAsRead(id);

    res.json({
      code: 200,
      message: '标记成功',
      data: message,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/unread-count', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const count = messageService.getUnreadCount(
      req.user.userId,
      req.user.role,
      req.user.outletId
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/mark-all-read', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const count = messageService.markAllAsRead(
      req.user.userId,
      req.user.role,
      req.user.outletId
    );

    res.json({
      code: 200,
      message: '标记成功',
      data: { markedCount: count },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
