import { Router, Request, Response } from 'express';
import { courierService } from '../services/courier.service';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/permission';
import { AppError } from '../middleware/error';

const router = Router();

router.get('/', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { page, pageSize } = req.query;
    const outletId = req.user.role === 'operator' ? undefined : req.user.outletId;

    const result = courierService.list(
      outletId,
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

router.get('/stats', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const outletId = req.user.role === 'operator' ? undefined : req.user.outletId;
    const result = courierService.list(outletId, 1, 1000);

    res.json({
      code: 200,
      message: '获取成功',
      data: result.list,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    if (!req.user || !req.user.outletId) {
      throw new AppError('未登录或网点信息不存在', 401);
    }

    const courierData = { ...req.body, outletId: req.user.outletId, password: req.body.password || '123456' };

    courierService.create(courierData).then((courier: any) => {
      res.json({
        code: 200,
        message: '创建成功',
        data: courier,
      });
    }).catch(next);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const courier = courierService.get(id);

    if (!courier) {
      throw new AppError('快递员不存在', 404);
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: courier,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stats', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const stats = courierService.getStats(id);

    res.json({
      code: 200,
      message: '获取成功',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const courierData = req.body;

    const courier = courierService.update(id, courierData);

    res.json({
      code: 200,
      message: '更新成功',
      data: courier,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    courierService.delete(id);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

