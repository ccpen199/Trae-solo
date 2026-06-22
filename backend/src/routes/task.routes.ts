import { Router } from 'express';
import Joi from 'joi';
import { authenticateRider } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { success, error } from '../utils/response.js';
import { getDispatchService } from '../services/dispatch.service.js';
import { AppDataSource } from '../config/database.js';
import { OrderEntity } from '../entities/Order.entity.js';
import { TaskPoolEntity } from '../entities/TaskPool.entity.js';

const router = Router();

const grabOrderSchema = Joi.object({
  taskId: Joi.string().uuid().required(),
});

const acceptTaskSchema = Joi.object({
  taskId: Joi.string().uuid().required(),
});

router.get('/available', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { page = 1, pageSize = 20 } = req.query;

    const dispatchService = getDispatchService();
    const result = await dispatchService.getAvailableTasks(
      riderId,
      Number(page),
      Number(pageSize)
    );

    success(res, {
      items: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/grab', authenticateRider, validate(grabOrderSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { taskId } = req.body;

    const dispatchService = getDispatchService();
    const result = await dispatchService.grabTask(taskId, riderId);

    if (result.success) {
      const order = result.orderId
        ? await AppDataSource.getRepository(OrderEntity).findOne({ where: { id: result.orderId } })
        : null;
      success(res, { success: true, orderId: result.orderId, order }, result.message);
    } else {
      error(res, result.message, 400);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/accept', authenticateRider, validate(acceptTaskSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { taskId } = req.body;

    const dispatchService = getDispatchService();
    const result = await dispatchService.acceptTask(taskId, riderId);

    if (result) {
      const order = await AppDataSource.getRepository(OrderEntity).findOne({ where: { id: result.orderId } });
      success(res, { ...result, success: true, order }, '接单成功');
    } else {
      error(res, '接单失败，任务可能已被其他骑手接走或已过期', 400);
    }
  } catch (err) {
    next(err);
  }
});

router.get(['/current', '/my-current'], authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
    const currentTask = await taskRepo.findOne({
      where: [
        { assignedRiderId: riderId, status: 'accepted' },
        { assignedRiderId: riderId, status: 'dispatched' },
      ],
      relations: ['order'],
      order: { updatedAt: 'DESC' },
    });

    success(res, currentTask || null);
  } catch (err) {
    next(err);
  }
});

export default router;
