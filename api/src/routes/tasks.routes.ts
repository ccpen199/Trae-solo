import { Router, Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/permission';
import { AppError } from '../middleware/error';
import type { TaskStatus } from '../../../shared/types';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { status, startDate, endDate, page, pageSize, courierId } = req.query;

    const result = taskService.list({
      userId: req.user.userId,
      role: req.user.role,
      outletId: req.user.outletId,
      status: status as TaskStatus,
      startDate: startDate as string,
      endDate: endDate as string,
      courierId: courierId as string,
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

router.get('/stats', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const stats = taskService.getStats(
      req.user.userId,
      req.user.role,
      req.user.outletId
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/unsynced', authMiddleware, requireRole('courier'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const tasks = taskService.getUnsynced(req.user.userId);

    res.json({
      code: 200,
      message: '获取成功',
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/sync', authMiddleware, (req: Request, res: Response, next) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new AppError('请提供要同步的任务ID列表', 400);
    }

    taskService.syncOffline(taskIds);

    res.json({
      code: 200,
      message: '同步成功',
      data: { syncedCount: taskIds.length },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const task = taskService.get(id);

    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const task = taskService.update(id, data);

    res.json({
      code: 200,
      message: '更新成功',
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/verify', authMiddleware, requireRole('courier'), (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const { pickupCode } = req.body;

    if (!pickupCode) {
      throw new AppError('取件码不能为空', 400);
    }

    const result = taskService.verifyPickupCode(id, pickupCode);

    res.json({
      code: 200,
      message: '核验成功',
      data: { success: result },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/weigh', authMiddleware, requireRole('courier'), (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const { actualWeight } = req.body;

    if (actualWeight === undefined || actualWeight === null) {
      throw new AppError('重量不能为空', 400);
    }

    const task = taskService.weigh(id, parseFloat(actualWeight));

    res.json({
      code: 200,
      message: '称重成功',
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/calculate', authMiddleware, (req: Request, res: Response, next) => {
  try {
    const { weight, itemType, hasInsurance, declaredValue } = req.body;

    if (!weight) {
      throw new AppError('重量不能为空', 400);
    }

    const result = taskService.calculateFreight(
      parseFloat(weight),
      itemType as string,
      hasInsurance as boolean,
      declaredValue ? parseFloat(declaredValue) : undefined
    );

    res.json({
      code: 200,
      message: '计算成功',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/batch-assign', authMiddleware, requireRole('admin', 'operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { taskIds, courierId } = req.body;
    const count = taskService.batchAssign(
      taskIds,
      courierId,
      req.user.role,
      req.user.outletId
    );

    res.json({
      code: 200,
      message: `已成功分配 ${count} 个任务`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/intervene', authMiddleware, requireRole('operator'), (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { id } = req.params;
    const { action, reason, courierId } = req.body;

    if (!action) {
      throw new AppError('请选择干预动作', 400);
    }

    const task = taskService.intervene(
      id,
      action,
      req.user.userId,
      req.user.username,
      { reason, courierId }
    );

    res.json({
      code: 200,
      message: '干预成功',
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/print', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { id } = req.params;
    const { waybillNo, printerName, paperSize } = req.body;

    if (!waybillNo) {
      throw new AppError('运单号不能为空', 400);
    }

    const result = taskService.recordPrint(
      id,
      waybillNo,
      printerName || '默认打印机',
      paperSize || '100x150',
      req.user.userId
    );

    res.json({
      code: 200,
      message: '打印成功',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
