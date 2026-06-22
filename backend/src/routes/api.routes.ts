import { Router } from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validation.js';
import { success, error } from '../utils/response.js';
import { AppDataSource } from '../config/database.js';
import { OrderEntity } from '../entities/Order.entity.js';
import { RiderEntity } from '../entities/Rider.entity.js';
import { getDispatchService } from '../services/dispatch.service.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import axios from 'axios';
import { ApiDispatchRequest, ApiDispatchResponse } from '@shared/types';

const router = Router();

const dispatchOrderSchema = Joi.object({
  orderId: Joi.string().required(),
  orderType: Joi.string().valid('delivery', 'pickup', 'errands', 'shopping').required(),
  pickupLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),
  deliveryLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),
  expectedDeliveryTime: Joi.date().optional(),
  amount: Joi.number().min(0).required(),
  callbackUrl: Joi.string().uri().required(),
});

const orderStatusSchema = Joi.object({
  externalOrderNo: Joi.string().required(),
  status: Joi.string().valid('pending', 'accepted', 'picking_up', 'delivering', 'completed', 'cancelled', 'exception').required(),
  riderId: Joi.string().uuid().optional(),
  riderName: Joi.string().optional(),
  riderPhone: Joi.string().optional(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
  }).optional(),
  remark: Joi.string().optional(),
});

const apiAuth = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return error(res, '无效的API密钥', 401);
  }
  next();
};

router.use(apiAuth);

router.post('/dispatch', validate(dispatchOrderSchema), async (req, res, next) => {
  try {
    const data = req.body as ApiDispatchRequest;
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const dispatchService = getDispatchService();

    const existingOrder = await orderRepo.findOne({
      where: { externalOrderNo: data.orderId },
    });

    if (existingOrder) {
      return error(res, '该外部订单号已存在', 409);
    }

    const { generateOrderNo, calculateDistance } = await import('../utils/geolocation');

    const distance = calculateDistance(data.pickupLocation, data.deliveryLocation);
    const estimatedTime = Math.max(15, Math.ceil(distance / 200));
    const orderNo = generateOrderNo();

    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + estimatedTime + 30);

    const order = orderRepo.create({
      orderNo,
      type: data.orderType,
      title: `外部订单 - ${data.orderType}`,
      amount: data.amount,
      distance,
      estimatedTime,
      pickupAddress: '外部订单取货地址',
      pickupLocation: data.pickupLocation,
      deliveryAddress: '外部订单送货地址',
      deliveryLocation: data.deliveryLocation,
      deliveryName: '收件人',
      deliveryPhone: '00000000000',
      deadline,
      status: 'pending',
      isUrgent: false,
      requireSignature: false,
      source: 'api',
      externalOrderNo: data.orderId,
    });

    await orderRepo.save(order);

    const task = await dispatchService.createTask(order);

    const result: ApiDispatchResponse = {
      success: true,
      taskId: task.id,
      estimatedDispatchTime: 300,
      message: '订单已提交，正在调度中',
    };

    success(res, result);

    setTimeout(async () => {
      try {
        await dispatchService.dispatchTask(task.id);
      } catch (err) {
        console.error('自动派单失败:', err);
      }
    }, 2000);
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:externalOrderNo/status', async (req, res, next) => {
  try {
    const { externalOrderNo } = req.params;
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const order = await orderRepo.findOne({
      where: { externalOrderNo },
      relations: ['rider'],
    });

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    success(res, {
      externalOrderNo,
      status: order.status,
      riderId: order.rider?.id,
      riderName: order.rider?.realName || order.rider?.nickname,
      riderPhone: order.rider?.phone,
      riderLocation: order.rider?.currentLocation,
      actualPickupTime: order.actualPickupTime,
      actualDeliveryTime: order.actualDeliveryTime,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/status-callback', validate(orderStatusSchema), async (req, res, next) => {
  try {
    const data = req.body;
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const order = await orderRepo.findOne({
      where: { externalOrderNo: data.externalOrderNo },
    });

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    order.status = data.status;
    if (data.remark) {
      order.cancelReason = order.cancelReason || data.remark;
      order.exceptionReason = order.exceptionReason || data.remark;
    }

    await orderRepo.save(order);

    success(res, null, '状态更新成功');
  } catch (err) {
    next(err);
  }
});

router.get('/riders/:riderId', async (req, res, next) => {
  try {
    const { riderId } = req.params;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const rider = await riderRepo.findOne({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    const { password, idCard, ...riderInfo } = rider;

    success(res, {
      riderId: rider.id,
      phone: rider.phone,
      nickname: rider.nickname,
      realName: rider.realName,
      avatar: rider.avatar,
      vehicleType: rider.vehicleType,
      creditScore: rider.creditScore,
      isOnline: rider.isOnline,
      isFrozen: rider.isFrozen,
      currentLocation: rider.currentLocation,
      currentTaskId: rider.currentTaskId,
      completedOrders: rider.completedOrders,
      realNameVerified: rider.realNameVerified,
      qualificationVerified: rider.qualificationVerified,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/riders/available', async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    let query = riderRepo
      .createQueryBuilder('rider')
      .where('rider.isOnline = :isOnline', { isOnline: true })
      .andWhere('rider.isFrozen = :isFrozen', { isFrozen: false })
      .andWhere('rider.qualificationVerified = :verified', { verified: true })
      .andWhere('rider.currentTaskId IS NULL');

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const r = parseFloat(radius as string);

      query.addSelect(
        `ST_Distance_Sphere(
          ST_MakePoint(:lng, :lat),
          ST_MakePoint((rider.currentLocation->>'longitude')::float, (rider.currentLocation->>'latitude')::float)
        )`,
        'distance'
      );

      query.andWhere(
        `ST_Distance_Sphere(
          ST_MakePoint(:lng, :lat),
          ST_MakePoint((rider.currentLocation->>'longitude')::float, (rider.currentLocation->>'latitude')::float)
        ) <= :radius`
      );

      query.setParameters({ lng, lat, radius: r });
      query.orderBy('distance', 'ASC');
    }

    const riders = await query.getMany();

    const ridersInfo = riders.map((rider) => ({
      riderId: rider.id,
      phone: rider.phone,
      nickname: rider.nickname,
      avatar: rider.avatar,
      vehicleType: rider.vehicleType,
      creditScore: rider.creditScore,
      currentLocation: rider.currentLocation,
      completedOrders: rider.completedOrders,
    }));

    success(res, ridersInfo);
  } catch (err) {
    next(err);
  }
});

router.post('/webhook/test', async (req, res, next) => {
  try {
    const { url, event, data } = req.body;

    if (!url || !event) {
      throw new ValidationError('缺少必要参数');
    }

    const webhookData = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      const response = await axios.post(url, webhookData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'test-signature',
        },
      });

      success(res, {
        success: true,
        statusCode: response.status,
        responseData: response.data,
      }, 'Webhook 测试成功');
    } catch (err) {
      success(res, {
        success: false,
        error: (err as Error).message,
      }, 'Webhook 测试失败');
    }
  } catch (err) {
    next(err);
  }
});

export default router;
