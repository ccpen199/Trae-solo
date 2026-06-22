import { Router } from 'express';
import Joi from 'joi';
import { authenticateRider } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { success, error } from '../utils/response';
import { AppDataSource } from '../config/database';
import { OrderEntity } from '../entities/Order.entity';
import { TaskPoolEntity } from '../entities/TaskPool.entity';
import { RiderEntity } from '../entities/Rider.entity';
import { OrderTrajectoryEntity } from '../entities/OrderTrajectory.entity';
import { OfflineSyncRecordEntity } from '../entities/OfflineSyncRecord.entity';
import { getDispatchService } from '../services/dispatch.service';
import { generateOrderNo, calculateDistance } from '../utils/geolocation';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { OrderCreateRequest, OrderStatus, OrderStatusUpdateRequest } from '@shared/types';

const router = Router();

const createOrderSchema = Joi.object({
  type: Joi.string().valid('delivery', 'pickup', 'errands', 'shopping').required(),
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  amount: Joi.number().min(0).required(),
  tip: Joi.number().min(0).optional(),
  pickupAddress: Joi.string().min(5).max(500).required(),
  pickupLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),
  pickupName: Joi.string().optional(),
  pickupPhone: Joi.string().optional(),
  deliveryAddress: Joi.string().min(5).max(500).required(),
  deliveryLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),
  deliveryName: Joi.string().required(),
  deliveryPhone: Joi.string().required(),
  weight: Joi.number().min(0).optional(),
  size: Joi.string().optional(),
  goodsDesc: Joi.string().optional(),
  expectedPickupTime: Joi.date().optional(),
  expectedDeliveryTime: Joi.date().optional(),
  isUrgent: Joi.boolean().default(false),
  requireSignature: Joi.boolean().default(false),
  photos: Joi.array().items(Joi.string()).optional(),
  source: Joi.string().valid('system', 'api', 'manual').default('system'),
  externalOrderNo: Joi.string().optional(),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('accepted', 'picking_up', 'delivering', 'completed', 'cancelled', 'exception').required(),
  remark: Joi.string().optional(),
  photos: Joi.array().items(Joi.string()).optional(),
});

router.post('/', validate(createOrderSchema), async (req, res, next) => {
  try {
    const orderData = req.body as OrderCreateRequest;
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const distance = calculateDistance(orderData.pickupLocation, orderData.deliveryLocation);
    const estimatedTime = Math.max(15, Math.ceil(distance / 200));

    const orderNo = generateOrderNo();

    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + estimatedTime + 30);

    const order = orderRepo.create({
      ...orderData,
      orderNo,
      distance,
      estimatedTime,
      deadline,
      status: 'pending',
      isUrgent: orderData.isUrgent || false,
      requireSignature: orderData.requireSignature || false,
      source: orderData.source || 'system',
    });

    await orderRepo.save(order);

    const dispatchService = getDispatchService();
    const task = await dispatchService.createTask(order);

    success(res, {
      order,
      taskId: task.id,
    }, '订单创建成功');
  } catch (err) {
    next(err);
  }
});

router.get('/my-orders', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { status, page = 1, pageSize = 20 } = req.query;
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const where: any = { riderId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await orderRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    success(res, {
      data: orders,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticateRider, async (req, res, next) => {
  try {
    const { id } = req.params;
    const riderId = req.user!.riderId;
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const order = await orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.riderId && order.riderId !== riderId) {
      return error(res, '无权查看该订单', 403);
    }

    success(res, order);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', authenticateRider, validate(statusUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const riderId = req.user!.riderId;
    const { status, remark, photos } = req.body as OrderStatusUpdateRequest;
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);

    const order = await orderRepo.findOne({ where: { id, riderId } });
    if (!order) {
      throw new NotFoundError('订单不存在或不属于您');
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['accepted', 'cancelled'],
      accepted: ['picking_up', 'cancelled', 'exception'],
      picking_up: ['delivering', 'exception'],
      delivering: ['completed', 'exception'],
      completed: [],
      cancelled: [],
      exception: [],
    };

    if (!validTransitions[order.status].includes(status as OrderStatus)) {
      throw new ValidationError(`无法从 ${order.status} 状态转换到 ${status}`);
    }

    const updateData: any = { status };
    const now = new Date();

    if (status === 'picking_up') {
      updateData.actualPickupTime = now;
    } else if (status === 'completed') {
      updateData.actualDeliveryTime = now;

      const rider = await riderRepo.findOne({ where: { id: riderId } });
      if (rider) {
        rider.completedOrders += 1;
        rider.totalDistance += order.distance;
        rider.totalEarnings += order.amount + (order.tip || 0);
        rider.currentTaskId = undefined;
        await riderRepo.save(rider);
      }

      const task = await taskRepo.findOne({ where: { orderId: id } });
      if (task) {
        task.status = 'accepted';
        await taskRepo.save(task);
      }
    } else if (status === 'cancelled' || status === 'exception') {
      updateData.cancelReason = remark;
      updateData.exceptionReason = remark;

      const rider = await riderRepo.findOne({ where: { id: riderId } });
      if (rider) {
        rider.currentTaskId = undefined;
        rider.creditScore = Math.max(0, rider.creditScore - 3);
        await riderRepo.save(rider);
      }
    }

    if (remark) {
      updateData.cancelReason = updateData.cancelReason || remark;
      updateData.exceptionReason = updateData.exceptionReason || remark;
    }

    if (photos && photos.length > 0) {
      updateData.photos = [...(order.photos || []), ...photos];
    }

    await orderRepo.update(id, updateData);

    const updatedOrder = await orderRepo.findOne({ where: { id } });

    success(res, updatedOrder, '订单状态已更新');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/trajectory', authenticateRider, async (req, res, next) => {
  try {
    const { id } = req.params;
    const riderId = req.user!.riderId;
    const trajRepo = AppDataSource.getRepository(OrderTrajectoryEntity);

    const trajectory = await trajRepo.findOne({
      where: { orderId: id, riderId },
      order: { createdAt: 'DESC' },
    });

    success(res, trajectory || { orderId: id, riderId, points: [], distance: 0, duration: 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/offline-sync', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { records } = req.body;
    const syncRepo = AppDataSource.getRepository(OfflineSyncRecordEntity);

    if (!Array.isArray(records) || records.length === 0) {
      throw new ValidationError('同步数据不能为空');
    }

    const results = [];
    for (const record of records) {
      const syncRecord = syncRepo.create({
        riderId,
        syncType: record.syncType,
        data: record.data,
        status: 'pending',
        retryCount: 0,
      });

      await syncRepo.save(syncRecord);

      try {
        if (record.syncType === 'order_status') {
          const { orderId, status, remark, photos } = record.data;
          const orderRepo = AppDataSource.getRepository(OrderEntity);
          await orderRepo.update(orderId, { status, remark, photos });
        } else if (record.syncType === 'location') {
        }

        syncRecord.status = 'synced';
        syncRecord.syncedAt = new Date();
        await syncRepo.save(syncRecord);

        results.push({ id: syncRecord.id, success: true });
      } catch (syncErr) {
        syncRecord.status = 'failed';
        syncRecord.errorMessage = (syncErr as Error).message;
        await syncRepo.save(syncRecord);
        results.push({ id: syncRecord.id, success: false, error: (syncErr as Error).message });
      }
    }

    success(res, { results }, '离线数据同步完成');
  } catch (err) {
    next(err);
  }
});

export default router;
