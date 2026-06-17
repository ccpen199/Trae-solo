import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { ok, fail, paginated } from '../utils/response';
import { UserRole, CourierTaskStatus, OrderStatus } from '@platform/shared';
import { updateOrderStatus, createAlert } from '../services/order.service';
import { createAuditLog, AuditActions } from '../services/audit.service';
import { haversineDistance } from '@platform/shared';

const router = Router();

router.post('/location/report', authMiddleware([UserRole.COURIER]), [
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lon').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat(),
  body('taskId').optional(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { lat, lon, accuracy, taskId } = req.body;
  const profile = await prisma.courierProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return fail(res, 404, '揽收员资料不存在');

  await prisma.courierProfile.update({
    where: { id: profile.id },
    data: { currentLat: lat, currentLon: lon, locationUpdatedAt: new Date() },
  });

  if (taskId) {
    await prisma.courierLocationLog.create({
      data: { taskId, lat, lon, accuracy },
    });
  }
  return ok(res, null, '位置上报成功');
});

router.get('/tasks', authMiddleware([UserRole.COURIER]), [
  query('status').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 50 }),
], async (req: Request, res: Response) => {
  const profile = await prisma.courierProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return fail(res, 404, '揽收员资料不存在');
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const where: any = { courierId: profile.id };
  if (req.query.status) where.status = req.query.status;

  const [tasks, total] = await Promise.all([
    prisma.courierTask.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: { order: true },
    }),
    prisma.courierTask.count({ where }),
  ]);

  const list = tasks.map(t => ({
    id: t.id, taskNo: t.taskNo, taskType: t.taskType, status: t.status,
    orderId: t.orderId, orderNo: t.order?.orderNo, orderType: t.order?.orderType,
    pickupLat: t.pickupLat, pickupLon: t.pickupLon,
    distance: t.distanceToPickupKm,
    createdAt: t.createdAt,
    acceptedAt: t.acceptedAt, pickedAt: t.pickedAt, completedAt: t.completedAt,
    appointment: t.order?.pickupAppointmentFrom ? {
      from: t.order.pickupAppointmentFrom,
      to: t.order.pickupAppointmentTo,
    } : null,
  }));
  return paginated(res, list, total, page, pageSize);
});

router.post('/tasks/:taskId/accept', authMiddleware([UserRole.COURIER]), async (req: Request, res: Response) => {
  const task = await prisma.courierTask.findUnique({ where: { id: req.params.taskId }, include: { order: true, courier: true } });
  if (!task) return fail(res, 404, '任务不存在');
  if (task.courier.userId !== req.user!.userId) return fail(res, 403, '无权操作');
  if (task.status !== CourierTaskStatus.PENDING) return fail(res, 400, '当前状态不可接单');

  await prisma.$transaction([
    prisma.courierTask.update({ where: { id: task.id }, data: { status: CourierTaskStatus.ACCEPTED, acceptedAt: new Date() } }),
    prisma.order.update({ where: { id: task.orderId }, data: { status: OrderStatus.COURIER_ASSIGNED } }),
  ]);

  await createAuditLog(req.user!, AuditActions.COURIER_TASK_ACCEPT, 'CourierTask', { targetId: task.id, traceId: req.traceId });
  return ok(res, null, '已接单');
});

router.post('/tasks/:taskId/arrive', authMiddleware([UserRole.COURIER]), [
  body('lat').isFloat(), body('lon').isFloat(),
], async (req: Request, res: Response) => {
  const task = await prisma.courierTask.findUnique({ where: { id: req.params.taskId }, include: { courier: true } });
  if (!task) return fail(res, 404, '任务不存在');
  if (task.courier.userId !== req.user!.userId) return fail(res, 403, '无权操作');
  if (task.status !== CourierTaskStatus.EN_ROUTE && task.status !== CourierTaskStatus.ACCEPTED) {
    return fail(res, 400, '当前状态不可标记到达');
  }
  await prisma.courierTask.update({
    where: { id: task.id },
    data: { status: CourierTaskStatus.ARRIVED, arrivedAt: new Date() },
  });
  return ok(res, null, '已标记到达');
});

router.post('/tasks/:taskId/pickup', authMiddleware([UserRole.COURIER]), [
  body('photoUrl').notEmpty(),
  body('materials').isArray(),
  body('signerName').optional(),
  body('signerIdCard').optional(),
  body('lat').isFloat(), body('lon').isFloat(),
], async (req: Request, res: Response) => {
  const task = await prisma.courierTask.findUnique({ where: { id: req.params.taskId }, include: { order: true, courier: true } });
  if (!task) return fail(res, 404, '任务不存在');
  if (task.courier.userId !== req.user!.userId) return fail(res, 403, '无权操作');
  if (![CourierTaskStatus.ARRIVED, CourierTaskStatus.ACCEPTED, CourierTaskStatus.EN_ROUTE].includes(task.status as any)) {
    return fail(res, 400, '当前状态不可收件');
  }
  const { encrypt, maskName, maskIdCard } = require('../utils/encryption');
  const { photoUrl, materials, signerName, signerIdCard } = req.body;
  await prisma.$transaction([
    prisma.courierTask.update({
      where: { id: task.id },
      data: {
        status: CourierTaskStatus.PICKED,
        pickedAt: new Date(),
        pickupPhotoUrl: photoUrl,
        signerNameMasked: signerName ? maskName(signerName) : undefined,
        signerIdCardMasked: signerIdCard ? maskIdCard(signerIdCard) : undefined,
        remark: `收件材料：${materials.join(', ')}`,
      },
    }),
    prisma.order.update({
      where: { id: task.orderId },
      data: { status: OrderStatus.OCR_PROCESSING },
    }),
    prisma.ocrRecord.updateMany({
      where: { orderId: task.orderId, status: 'PENDING' as any },
      data: {
        status: 'SUCCESS' as any,
        ocrResult: { materials, recognized: true, confidence: 0.95 },
        confidence: 0.95,
        completedAt: new Date(),
      },
    }),
  ]);

  setTimeout(async () => {
    try {
      await prisma.order.update({ where: { id: task.orderId }, data: { status: OrderStatus.PRE_REVIEW_PASSED } });
      await prisma.orderStatusLog.create({
        data: { orderId: task.orderId, toStatus: OrderStatus.PRE_REVIEW_PASSED, remark: '系统自动预审通过', extraData: { materials } },
      });
    } catch {}
  }, 3000);

  await createAuditLog(req.user!, AuditActions.COURIER_TASK_COMPLETE, 'CourierTask', { targetId: task.id, traceId: req.traceId });
  return ok(res, null, '收件完成');
});

router.post('/tasks/:taskId/enroute', authMiddleware([UserRole.COURIER]), async (req: Request, res: Response) => {
  const task = await prisma.courierTask.findUnique({ where: { id: req.params.taskId }, include: { courier: true } });
  if (!task) return fail(res, 404, '任务不存在');
  if (task.courier.userId !== req.user!.userId) return fail(res, 403, '无权操作');
  if (task.status !== CourierTaskStatus.ACCEPTED) return fail(res, 400, '当前状态不可出发');
  await prisma.courierTask.update({ where: { id: task.id }, data: { status: CourierTaskStatus.EN_ROUTE, enRouteAt: new Date() } });
  return ok(res, null, '已出发');
});

router.post('/tasks/:taskId/deliver', authMiddleware([UserRole.COURIER]), [
  body('photoUrl').notEmpty(),
  body('signerName').optional(),
  body('signed').default(true),
], async (req: Request, res: Response) => {
  const task = await prisma.courierTask.findUnique({ where: { id: req.params.taskId }, include: { order: true, courier: true } });
  if (!task) return fail(res, 404, '任务不存在');
  if (task.courier.userId !== req.user!.userId) return fail(res, 403, '无权操作');
  if (![CourierTaskStatus.DELIVERING, CourierTaskStatus.PICKED].includes(task.status as any)) {
    return fail(res, 400, '当前状态不可派件完成');
  }
  const { photoUrl, signerName, signed } = req.body;
  const { maskName } = require('@platform/shared');
  await prisma.$transaction([
    prisma.courierTask.update({
      where: { id: task.id },
      data: {
        status: CourierTaskStatus.COMPLETED,
        deliveredAt: new Date(),
        completedAt: new Date(),
        deliveryPhotoUrl: photoUrl,
        signerNameMasked: signerName ? maskName(signerName) : undefined,
      },
    }),
    prisma.emsShipment.updateMany({
      where: { orderId: task.orderId, status: 'IN_TRANSIT' },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        signedAt: new Date(),
        signedByNameMasked: signerName ? maskName(signerName) : undefined,
      },
    }),
  ]);

  const remaining = await prisma.courierTask.count({ where: { orderId: task.orderId, status: { not: CourierTaskStatus.COMPLETED } } });
  if (remaining === 0) {
    const order = await prisma.order.findUnique({ where: { id: task.orderId } });
    if (order && ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status as any)) {
      await prisma.order.update({ where: { id: task.orderId }, data: { status: OrderStatus.COMPLETED, completedAt: new Date() } });
      await prisma.electronicReceipt.create({
        data: {
          orderId: task.orderId,
          receiptNo: `REC${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          receiptType: task.order?.orderType || 'GENERAL',
          receiptData: { orderNo: task.order?.orderNo, completedAt: new Date(), signer: signerName || '本人签收' },
          verifyCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
        },
      });
    }
  }

  return ok(res, null, '派件完成');
});

router.get('/stats/today', authMiddleware([UserRole.COURIER]), async (req: Request, res: Response) => {
  const profile = await prisma.courierProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return fail(res, 404, '揽收员资料不存在');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const [total, pending, picked, completed] = await Promise.all([
    prisma.courierTask.count({ where: { courierId: profile.id, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.courierTask.count({ where: { courierId: profile.id, status: { in: [CourierTaskStatus.PENDING, CourierTaskStatus.ACCEPTED, CourierTaskStatus.EN_ROUTE, CourierTaskStatus.ARRIVED] } } }),
    prisma.courierTask.count({ where: { courierId: profile.id, status: { in: [CourierTaskStatus.PICKED, CourierTaskStatus.DELIVERING] } } }),
    prisma.courierTask.count({ where: { courierId: profile.id, status: CourierTaskStatus.COMPLETED, createdAt: { gte: today, lt: tomorrow } } }),
  ]);
  return ok(res, { total, pending, picked, completed, rating: profile.rating, isOnDuty: profile.isOnDuty, todayTaskCount: profile.todayTaskCount });
});

router.post('/duty/toggle', authMiddleware([UserRole.COURIER]), [body('onDuty').isBoolean()], async (req: Request, res: Response) => {
  const profile = await prisma.courierProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) return fail(res, 404, '揽收员资料不存在');
  await prisma.courierProfile.update({ where: { id: profile.id }, data: { isOnDuty: req.body.onDuty } });
  return ok(res, { isOnDuty: req.body.onDuty }, req.body.onDuty ? '已开始上班' : '已下班');
});

export default router;
