import { Router, Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/permission';
import { AppError } from '../middleware/error';
import type { OrderStatus } from '../../../shared/types';

const router = Router();

router.get('/', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { status, page, pageSize } = req.query;

    const result = orderService.list(
      req.user.role,
      req.user.outletId,
      status as OrderStatus,
      page ? parseInt(page as string, 10) : undefined,
      pageSize ? parseInt(pageSize as string, 10) : undefined
    );

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

router.get('/:id', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const result = orderService.getWithTask(id);

    res.json({
      code: 200,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
