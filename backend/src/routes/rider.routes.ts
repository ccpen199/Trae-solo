import { Router } from 'express';
import Joi from 'joi';
import { authenticateRider } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { success, error } from '../utils/response.js';
import { AppDataSource } from '../config/database.js';
import { RiderEntity } from '../entities/Rider.entity.js';
import { RiderPreferenceEntity } from '../entities/RiderPreference.entity.js';
import { CreditHistoryEntity } from '../entities/CreditHistory.entity.js';
import { AuditFlowEntity } from '../entities/AuditFlow.entity.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { RealNameAuthRequest, RiderStatistics } from '@shared/types';

const router = Router();

const realNameAuthSchema = Joi.object({
  realName: Joi.string().min(2).max(50).required(),
  idCard: Joi.string().length(18).pattern(/^\d{17}[\dXx]$/).required(),
  idCardFront: Joi.string().uri().required(),
  idCardBack: Joi.string().uri().required(),
  healthCertificate: Joi.string().uri().optional(),
  vehicleType: Joi.string().valid('bike', 'electric_bike', 'motorcycle', 'car').required(),
  vehiclePlate: Joi.string().optional(),
  vehicleLicense: Joi.string().uri().optional(),
});

const preferenceSchema = Joi.object({
  maxDistance: Joi.number().min(100).max(20000).optional(),
  orderTypes: Joi.array().items(Joi.string().valid('delivery', 'pickup', 'errands', 'shopping')).optional(),
  workingHours: Joi.array().items(
    Joi.object({
      start: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      end: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    })
  ).optional(),
  autoAccept: Joi.boolean().optional(),
  minOrderAmount: Joi.number().min(0).optional(),
  preferredAreas: Joi.array().items(Joi.string()).optional(),
});

router.get('/preference', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const prefRepo = AppDataSource.getRepository(RiderPreferenceEntity);

    const preference = await prefRepo.findOne({ where: { riderId } });
    if (!preference) {
      throw new NotFoundError('偏好设置不存在');
    }

    success(res, preference);
  } catch (err) {
    next(err);
  }
});

router.put('/preference', authenticateRider, validate(preferenceSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const prefRepo = AppDataSource.getRepository(RiderPreferenceEntity);

    const preference = await prefRepo.findOne({ where: { riderId } });
    if (!preference) {
      throw new NotFoundError('偏好设置不存在');
    }

    await prefRepo.update(preference.id, req.body);
    const updated = await prefRepo.findOne({ where: { riderId } });

    success(res, updated, '偏好设置已更新');
  } catch (err) {
    next(err);
  }
});

router.post('/real-name-auth', authenticateRider, validate(realNameAuthSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    if (rider.realNameVerified) {
      return error(res, '已完成实名认证，无需重复提交', 400);
    }

    const data = req.body as RealNameAuthRequest;

    await riderRepo.update(riderId, {
      realName: data.realName,
      idCard: data.idCard,
      idCardFront: data.idCardFront,
      idCardBack: data.idCardBack,
      healthCertificate: data.healthCertificate,
      vehicleType: data.vehicleType,
      vehiclePlate: data.vehiclePlate,
      vehicleLicense: data.vehicleLicense,
      auditStatus: 'pending',
    });

    const auditFlow = auditRepo.create({
      type: 'real_name_auth',
      title: `${data.realName} - 实名认证申请`,
      applicantId: riderId,
      applicantType: 'rider',
      data: data as unknown as Record<string, unknown>,
      currentLevel: 'first',
      status: 'pending',
      auditLogs: [],
    });

    await auditRepo.save(auditFlow);

    success(res, { auditFlowId: auditFlow.id }, '实名认证申请已提交，等待审核');
  } catch (err) {
    next(err);
  }
});

router.get('/statistics', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const orderRepo = AppDataSource.getRepository('OrderEntity');

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayOrders = await orderRepo.count({
      where: { riderId, status: 'completed', updatedAt: { $gte: today } } as any,
    });

    const weekOrders = await orderRepo.count({
      where: { riderId, status: 'completed', updatedAt: { $gte: weekAgo } } as any,
    });

    const monthOrders = await orderRepo.count({
      where: { riderId, status: 'completed', updatedAt: { $gte: monthAgo } } as any,
    });

    const statistics: RiderStatistics = {
      todayOrders,
      todayEarnings: 0,
      todayDistance: 0,
      weekOrders,
      weekEarnings: 0,
      monthOrders,
      monthEarnings: 0,
      acceptRate: rider.completedOrders > 0 ? 95 : 0,
      completionRate: rider.completedOrders > 0 ? 98 : 0,
      averageDeliveryTime: 35,
    };

    success(res, statistics);
  } catch (err) {
    next(err);
  }
});

router.get('/credit-history', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { page = 1, pageSize = 20 } = req.query;
    const creditRepo = AppDataSource.getRepository(CreditHistoryEntity);

    const [records, total] = await creditRepo.findAndCount({
      where: { riderId },
      order: { createdAt: 'DESC' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    success(res, {
      data: records,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/online-status', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { isOnline, location } = req.body;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    if (rider.isFrozen) {
      return error(res, '账户已被冻结，无法上线', 403);
    }

    if (!rider.qualificationVerified && isOnline) {
      return error(res, '请先完成资质审核后再上线', 400);
    }

    const updateData: any = { isOnline };
    if (location) {
      updateData.currentLocation = location;
    }

    await riderRepo.update(riderId, updateData);

    success(res, { isOnline }, `已${isOnline ? '上线' : '下线'}`);
  } catch (err) {
    next(err);
  }
});

export default router;
