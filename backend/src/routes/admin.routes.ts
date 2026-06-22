import { Router } from 'express';
import Joi from 'joi';
import { authenticateAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { success, error } from '../utils/response.js';
import { AppDataSource } from '../config/database.js';
import { RiderEntity } from '../entities/Rider.entity.js';
import { OrderEntity } from '../entities/Order.entity.js';
import { TaskPoolEntity } from '../entities/TaskPool.entity.js';
import { AuditFlowEntity } from '../entities/AuditFlow.entity.js';
import { DispatchRuleEntity } from '../entities/DispatchRule.entity.js';
import { GeofenceEntity } from '../entities/Geofence.entity.js';
import { HotspotEntity } from '../entities/Hotspot.entity.js';
import { CreditHistoryEntity } from '../entities/CreditHistory.entity.js';
import { ComplaintEntity } from '../entities/Complaint.entity.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { getWebSocketService } from '../services/websocket.service.js';
import { getDispatchService } from '../services/dispatch.service.js';
import { Between, MoreThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const auditDecisionSchema = Joi.object({
  flowId: Joi.string().uuid().required(),
  decision: Joi.string().valid('approved', 'rejected').required(),
  remark: Joi.string().optional(),
  level: Joi.string().valid('first', 'second', 'final').required(),
});

const riderStatusSchema = Joi.object({
  riderId: Joi.string().uuid().required(),
  isFrozen: Joi.boolean().required(),
  frozenReason: Joi.string().when('isFrozen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  frozenDays: Joi.number().min(1).max(365).optional(),
});

const creditAdjustSchema = Joi.object({
  riderId: Joi.string().uuid().required(),
  change: Joi.number().integer().min(-100).max(100).required(),
  reason: Joi.string().min(5).max(500).required(),
  orderId: Joi.string().uuid().optional(),
});

router.get('/dashboard/overview', authenticateAdmin, async (req, res, next) => {
  try {
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalRiders,
      onlineRiders,
      todayOrders,
      completedOrders,
      pendingTasks,
      totalRevenue,
    ] = await Promise.all([
      riderRepo.count(),
      riderRepo.count({ where: { isOnline: true } }),
      orderRepo.count({ where: { createdAt: MoreThanOrEqual(today) } }),
      orderRepo.count({ where: { status: 'completed', updatedAt: Between(today, tomorrow) } }),
      taskRepo.count({ where: { status: 'available' } }),
      orderRepo
        .createQueryBuilder('order')
        .select('COALESCE(SUM(amount + COALESCE(tip, 0)), 0)', 'revenue')
        .where('order.status = :status', { status: 'completed' })
        .andWhere('order.updatedAt >= :today', { today })
        .getRawOne(),
    ]);

    const wsService = getWebSocketService();
    const realtimeRiders = wsService.getOnlineRiders();

    success(res, {
      totalRiders,
      onlineRiders,
      realtimeOnlineCount: realtimeRiders.length,
      todayOrders,
      completedOrders,
      pendingTasks,
      todayRevenue: parseFloat(totalRevenue?.revenue || 0),
      completionRate: todayOrders > 0 ? ((completedOrders / todayOrders) * 100).toFixed(1) : '0',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/riders', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, isOnline, isFrozen, auditStatus } = req.query;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const query = riderRepo.createQueryBuilder('rider');

    if (keyword) {
      query.andWhere('(rider.phone LIKE :keyword OR rider.nickname LIKE :keyword OR rider.realName LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }
    if (isOnline !== undefined) query.andWhere('rider.isOnline = :isOnline', { isOnline: isOnline === 'true' });
    if (isFrozen !== undefined) query.andWhere('rider.isFrozen = :isFrozen', { isFrozen: isFrozen === 'true' });
    if (auditStatus) query.andWhere('rider.auditStatus = :auditStatus', { auditStatus });

    const [riders, total] = await query
      .orderBy('rider.createdAt', 'DESC')
      .skip((Number(page) - 1) * Number(pageSize))
      .take(Number(pageSize))
      .getManyAndCount();

    const ridersWithoutPassword = riders.map(({ password, ...rest }) => rest);

    success(res, {
      data: ridersWithoutPassword,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/riders/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const rider = await riderRepo.findOne({
      where: { id },
      relations: ['preference'],
    });

    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    const { password, ...riderWithoutPassword } = rider;

    success(res, riderWithoutPassword);
  } catch (err) {
    next(err);
  }
});

router.put('/riders/status', authenticateAdmin, validate(riderStatusSchema), async (req, res, next) => {
  try {
    const { riderId, isFrozen, frozenReason, frozenDays } = req.body;
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const creditRepo = AppDataSource.getRepository(CreditHistoryEntity);

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    const updateData: any = { isFrozen, frozenReason };
    if (isFrozen && frozenDays) {
      updateData.frozenUntil = new Date(Date.now() + frozenDays * 24 * 60 * 60 * 1000);
    } else if (!isFrozen) {
      updateData.frozenUntil = null;
      updateData.frozenReason = null;
    }

    await riderRepo.update(riderId, updateData);

    if (isFrozen) {
      const creditHistory = creditRepo.create({
        riderId,
        change: -10,
        reason: `账户冻结: ${frozenReason}`,
        operatorId: 'admin',
      });
      await creditRepo.save(creditHistory);

      rider.creditScore = Math.max(0, rider.creditScore - 10);
      await riderRepo.save(rider);
    }

    const wsService = getWebSocketService();
    if (isFrozen && wsService.isRiderOnline(riderId)) {
      wsService.sendNotification(riderId, {
        title: '账户冻结通知',
        content: `您的账户已被冻结: ${frozenReason}`,
        type: 'system',
      });
    } else if (!isFrozen && wsService.isRiderOnline(riderId)) {
      wsService.sendNotification(riderId, {
        title: '账户解冻通知',
        content: '您的账户已解冻，可以正常接单了',
        type: 'system',
      });
    }

    success(res, null, `已${isFrozen ? '冻结' : '解冻'}骑手账户`);
  } catch (err) {
    next(err);
  }
});

router.put('/riders/credit', authenticateAdmin, validate(creditAdjustSchema), async (req, res, next) => {
  try {
    const { riderId, change, reason, orderId } = req.body;
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const creditRepo = AppDataSource.getRepository(CreditHistoryEntity);

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    rider.creditScore = Math.max(0, Math.min(100, rider.creditScore + change));
    await riderRepo.save(rider);

    const creditHistory = creditRepo.create({
      riderId,
      change,
      reason,
      orderId,
      operatorId: 'admin',
    });
    await creditRepo.save(creditHistory);

    if (rider.creditScore < 60 && !rider.isFrozen) {
      rider.isFrozen = true;
      rider.frozenReason = '信用分过低';
      rider.frozenUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await riderRepo.save(rider);
    }

    success(res, { newCreditScore: rider.creditScore }, '信用分已调整');
  } catch (err) {
    next(err);
  }
});

router.get('/audit-flows', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, type, status, level } = req.query;
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (level) where.currentLevel = level;

    const [flows, total] = await auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    success(res, {
      data: flows,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/audit/decision', authenticateAdmin, validate(auditDecisionSchema), async (req, res, next) => {
  try {
    const { flowId, decision, remark, level } = req.body;
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const wsService = getWebSocketService();

    const flow = await auditRepo.findOne({ where: { id: flowId } });
    if (!flow) {
      throw new NotFoundError('审核流程不存在');
    }

    if (flow.status !== 'pending') {
      return error(res, '该审核已处理', 400);
    }

    if (flow.currentLevel !== level) {
      return error(res, `当前审核级别为 ${flow.currentLevel}，请按顺序审核`, 400);
    }

    const auditLog = {
      id: uuidv4(),
      flowId,
      auditorId: 'admin',
      auditorName: '管理员',
      level,
      decision,
      remark,
      previousStatus: flow.status,
      nextStatus: decision,
      createdAt: new Date(),
    };

    flow.auditLogs.push(auditLog);

    const levelOrder: Record<string, number> = { first: 1, second: 2, final: 3 };
    const currentLevelNum = levelOrder[level];

    if (decision === 'approved' && currentLevelNum < 3) {
      flow.currentLevel = currentLevelNum === 1 ? 'second' : 'final';
      flow.status = 'pending';
    } else {
      flow.status = decision;
      flow.finalDecision = decision;
      flow.finalRemark = remark;
      flow.completedAt = new Date();

      if (flow.type === 'real_name_auth' && decision === 'approved') {
        await riderRepo.update(flow.applicantId, {
          realNameVerified: true,
          qualificationVerified: true,
          auditStatus: 'approved',
        });

        wsService.sendNotification(flow.applicantId, {
          title: '认证审核通过',
          content: '您的实名认证已通过，可以开始接单了',
          type: 'system',
        });
      } else if (flow.type === 'real_name_auth' && decision === 'rejected') {
        await riderRepo.update(flow.applicantId, {
          auditStatus: 'rejected',
          auditRemark: remark,
        });

        wsService.sendNotification(flow.applicantId, {
          title: '认证审核未通过',
          content: `您的实名认证未通过: ${remark}`,
          type: 'system',
        });
      } else if (flow.type === 'qualification_change' && decision === 'approved') {
        const data = flow.data as any;
        await riderRepo.update(flow.applicantId, {
          vehicleType: data.vehicleType,
          vehiclePlate: data.vehiclePlate,
          vehicleLicense: data.vehicleLicense,
          healthCertificate: data.healthCertificate,
        });
      } else if (flow.type === 'frozen_appeal' && decision === 'approved') {
        await riderRepo.update(flow.applicantId, {
          isFrozen: false,
          frozenReason: null,
          frozenUntil: null,
        });

        wsService.sendNotification(flow.applicantId, {
          title: '冻结申诉通过',
          content: '您的账户已解冻，可以正常接单了',
          type: 'system',
        });
      }
    }

    await auditRepo.save(flow);

    success(res, flow, '审核已处理');
  } catch (err) {
    next(err);
  }
});

router.get('/orders', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status, type, startDate, endDate } = req.query;
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const query = orderRepo.createQueryBuilder('order');

    if (status) query.andWhere('order.status = :status', { status });
    if (type) query.andWhere('order.type = :type', { type });
    if (startDate) query.andWhere('order.createdAt >= :startDate', { startDate: new Date(startDate as string) });
    if (endDate) query.andWhere('order.createdAt <= :endDate', { endDate: new Date(endDate as string) });

    const [orders, total] = await query
      .leftJoinAndSelect('order.rider', 'rider')
      .orderBy('order.createdAt', 'DESC')
      .skip((Number(page) - 1) * Number(pageSize))
      .take(Number(pageSize))
      .getManyAndCount();

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

router.get('/geofences', authenticateAdmin, async (req, res, next) => {
  try {
    const { type } = req.query;
    const geofenceRepo = AppDataSource.getRepository(GeofenceEntity);

    const where: any = {};
    if (type) where.type = type;

    const geofences = await geofenceRepo.find({ where, order: { createdAt: 'DESC' } });

    success(res, geofences);
  } catch (err) {
    next(err);
  }
});

router.post('/geofences', authenticateAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const geofenceRepo = AppDataSource.getRepository(GeofenceEntity);

    const geofence = geofenceRepo.create(data);
    await geofenceRepo.save(geofence);

    success(res, geofence, '地理围栏创建成功');
  } catch (err) {
    next(err);
  }
});

router.get('/hotspots', authenticateAdmin, async (req, res, next) => {
  try {
    const hotspotRepo = AppDataSource.getRepository(HotspotEntity);
    const hotspots = await hotspotRepo.find({ order: { heatLevel: 'DESC' } });
    success(res, hotspots);
  } catch (err) {
    next(err);
  }
});

router.get('/dispatch-rules', authenticateAdmin, async (req, res, next) => {
  try {
    const ruleRepo = AppDataSource.getRepository(DispatchRuleEntity);
    const rules = await ruleRepo.find({ order: { priority: 'ASC' } });
    success(res, rules);
  } catch (err) {
    next(err);
  }
});

router.post('/dispatch-rules', authenticateAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const ruleRepo = AppDataSource.getRepository(DispatchRuleEntity);

    const rule = ruleRepo.create(data);
    await ruleRepo.save(rule);

    const dispatchService = getDispatchService();
    await dispatchService.reloadRules();

    success(res, rule, '派单规则创建成功');
  } catch (err) {
    next(err);
  }
});

router.put('/dispatch-rules/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const ruleRepo = AppDataSource.getRepository(DispatchRuleEntity);

    await ruleRepo.update(id, data);

    const dispatchService = getDispatchService();
    await dispatchService.reloadRules();

    const rule = await ruleRepo.findOne({ where: { id } });
    success(res, rule, '派单规则已更新');
  } catch (err) {
    next(err);
  }
});

router.get('/complaints', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const complaintRepo = AppDataSource.getRepository(ComplaintEntity);

    const where: any = {};
    if (status) where.status = status;

    const [complaints, total] = await complaintRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    success(res, {
      data: complaints,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/complaints/:id/handle', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution, penaltyAmount, creditChange } = req.body;
    const complaintRepo = AppDataSource.getRepository(ComplaintEntity);
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const creditRepo = AppDataSource.getRepository(CreditHistoryEntity);

    const complaint = await complaintRepo.findOne({ where: { id } });
    if (!complaint) {
      throw new NotFoundError('投诉不存在');
    }

    complaint.status = status;
    complaint.resolution = resolution;
    complaint.handlerId = 'admin';

    if (status === 'resolved' && penaltyAmount) {
      complaint.penaltyAmount = penaltyAmount;
    }

    if (status === 'resolved' && creditChange) {
      complaint.creditChange = creditChange;

      const rider = await riderRepo.findOne({ where: { id: complaint.reporterId } });
      if (rider) {
        rider.creditScore = Math.max(0, rider.creditScore + creditChange);
        await riderRepo.save(rider);

        const creditHistory = creditRepo.create({
          riderId: complaint.reporterId,
          change: creditChange,
          reason: `投诉处理: ${resolution}`,
          orderId: complaint.orderId,
          operatorId: 'admin',
        });
        await creditRepo.save(creditHistory);
      }
    }

    complaint.appealDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await complaintRepo.save(complaint);

    success(res, complaint, '投诉已处理');
  } catch (err) {
    next(err);
  }
});

router.get('/statistics/orders', authenticateAdmin, async (req, res, next) => {
  try {
    const { period = 'day' } = req.query;
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const now = new Date();
    let startDate: Date;
    let dateFormat: string;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFormat = 'YYYY-MM-DD';
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = 'YYYY-MM-DD';
    } else {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateFormat = 'YYYY-MM-DD HH';
    }

    const orders = await orderRepo
      .createQueryBuilder('order')
      .select('DATE_TRUNC(:period, order.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(order.amount + COALESCE(order.tip, 0))', 'revenue')
      .where('order.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .setParameter('period', period === 'week' ? 'day' : period === 'month' ? 'day' : 'hour')
      .getRawMany();

    success(res, orders.map((o) => ({
      date: o.date,
      count: parseInt(o.count),
      revenue: parseFloat(o.revenue || 0),
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
