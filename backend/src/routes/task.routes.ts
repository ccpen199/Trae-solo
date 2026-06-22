import { Router } from 'express';
import Joi from 'joi';
import { authenticateRider } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { success, error } from '../utils/response';
import { getDispatchService } from '../services/dispatch.service';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

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

    success(res, result);
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
      success(res, { orderId: result.orderId }, result.message);
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
      success(res, result, '接单成功');
    } else {
      error(res, '接单失败，任务可能已被其他骑手接走或已过期', 400);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/my-current', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { AppDataSource } = await import('../config/database');
    const { OrderEntity } = await import('../entities/Order.entity');

    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const currentOrder = await orderRepo.findOne({
      where: [
        { riderId, status: 'accepted' },
        { riderId, status: 'picking_up' },
        { riderId, status: 'delivering' },
      ],
      order: { createdAt: 'DESC' },
    });

    success(res, currentOrder || null);
  } catch (err) {
    next(err);
  }
});

export default router;
