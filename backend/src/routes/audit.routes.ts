import { Router } from 'express';
import Joi from 'joi';
import { authenticateRider } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { success, error } from '../utils/response';
import { AppDataSource } from '../config/database';
import { AuditFlowEntity } from '../entities/AuditFlow.entity';
import { ComplaintEntity } from '../entities/Complaint.entity';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { AuditType, AppealRequest } from '@shared/types';

const router = Router();

const appealSchema = Joi.object({
  complaintId: Joi.string().uuid().required(),
  reason: Joi.string().min(10).max(1000).required(),
  evidence: Joi.array().items(Joi.string().uri()).min(1).required(),
});

const createQualificationChangeSchema = Joi.object({
  vehicleType: Joi.string().valid('bike', 'electric_bike', 'motorcycle', 'car').required(),
  vehiclePlate: Joi.string().optional(),
  vehicleLicense: Joi.string().uri().optional(),
  healthCertificate: Joi.string().uri().optional(),
});

router.get('/flows', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { type, status, page = 1, pageSize = 20 } = req.query;
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);

    const where: any = { applicantId: riderId };
    if (type) where.type = type;
    if (status) where.status = status;

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

router.get('/flows/:id', authenticateRider, async (req, res, next) => {
  try {
    const { id } = req.params;
    const riderId = req.user!.riderId;
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);

    const flow = await auditRepo.findOne({
      where: { id, applicantId: riderId },
    });

    if (!flow) {
      throw new NotFoundError('审核流程不存在');
    }

    success(res, flow);
  } catch (err) {
    next(err);
  }
});

router.post('/qualification-change', authenticateRider, validate(createQualificationChangeSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const data = req.body;
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);
    const riderRepo = AppDataSource.getRepository('RiderEntity');

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    const pendingFlow = await auditRepo.findOne({
      where: {
        applicantId: riderId,
        type: 'qualification_change',
        status: 'pending',
      },
    });

    if (pendingFlow) {
      return error(res, '您有一个资质变更申请正在审核中，请等待审核完成', 400);
    }

    const auditFlow = auditRepo.create({
      type: 'qualification_change',
      title: `${rider.nickname} - 资质变更申请`,
      applicantId: riderId,
      applicantType: 'rider',
      data: data as unknown as Record<string, unknown>,
      currentLevel: 'first',
      status: 'pending',
      auditLogs: [],
    });

    await auditRepo.save(auditFlow);

    success(res, { auditFlowId: auditFlow.id }, '资质变更申请已提交');
  } catch (err) {
    next(err);
  }
});

router.get('/complaints', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { status, page = 1, pageSize = 20 } = req.query;
    const complaintRepo = AppDataSource.getRepository(ComplaintEntity);

    const where: any = { reporterId: riderId };
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

router.post('/appeal', authenticateRider, validate(appealSchema), async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { complaintId, reason, evidence } = req.body as AppealRequest;
    const complaintRepo = AppDataSource.getRepository(ComplaintEntity);
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);

    const complaint = await complaintRepo.findOne({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundError('投诉记录不存在');
    }

    if (complaint.reporterId !== riderId) {
      return error(res, '无权申诉该投诉', 403);
    }

    if (complaint.appealed) {
      return error(res, '该投诉已申诉过，不可重复申诉', 400);
    }

    if (complaint.appealDeadline && new Date() > complaint.appealDeadline) {
      return error(res, '申诉已超过有效期', 400);
    }

    complaint.appealed = true;
    await complaintRepo.save(complaint);

    const auditFlow = auditRepo.create({
      type: 'credit_appeal',
      title: `申诉 - ${complaint.type}`,
      description: reason,
      applicantId: riderId,
      applicantType: 'rider',
      data: {
        complaintId,
        reason,
        evidence,
        originalComplaint: complaint,
      } as unknown as Record<string, unknown>,
      currentLevel: 'first',
      status: 'pending',
      auditLogs: [],
    });

    await auditRepo.save(auditFlow);

    success(res, { auditFlowId: auditFlow.id }, '申诉已提交，等待审核');
  } catch (err) {
    next(err);
  }
});

router.post('/frozen-appeal', authenticateRider, async (req, res, next) => {
  try {
    const riderId = req.user!.riderId;
    const { reason, evidence } = req.body;
    const riderRepo = AppDataSource.getRepository('RiderEntity');
    const auditRepo = AppDataSource.getRepository(AuditFlowEntity);

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider) {
      throw new NotFoundError('骑手不存在');
    }

    if (!rider.isFrozen) {
      return error(res, '账户未被冻结，无需申诉', 400);
    }

    const pendingFlow = await auditRepo.findOne({
      where: {
        applicantId: riderId,
        type: 'frozen_appeal',
        status: 'pending',
      },
    });

    if (pendingFlow) {
      return error(res, '您有一个冻结申诉正在审核中，请等待审核完成', 400);
    }

    const auditFlow = auditRepo.create({
      type: 'frozen_appeal',
      title: `${rider.nickname} - 账户冻结申诉`,
      description: reason,
      applicantId: riderId,
      applicantType: 'rider',
      data: {
        reason,
        evidence,
        frozenReason: rider.frozenReason,
        frozenUntil: rider.frozenUntil,
      } as unknown as Record<string, unknown>,
      currentLevel: 'first',
      status: 'pending',
      auditLogs: [],
    });

    await auditRepo.save(auditFlow);

    success(res, { auditFlowId: auditFlow.id }, '冻结申诉已提交');
  } catch (err) {
    next(err);
  }
});

export default router;
