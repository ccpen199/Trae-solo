import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { ok, fail, paginated } from '../utils/response';
import {
  UserRole, AlertType, AlertLevel,
  OrderType, OrderStatus, FundAccountType, FundTransactionType,
} from '@platform/shared';
import { config } from '../config';
import { createAuditLog, AuditActions } from '../services/audit.service';

const router = Router();

router.get('/alerts', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('type').optional(),
  query('level').optional(),
  query('isHandled').optional(),
  query('city').optional(),
], async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const where: any = {};
  if (req.user!.role === UserRole.CITY_OPERATOR) {
    const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (op) where.city = op.managedCity;
  }
  if (req.query.city && req.user!.role === UserRole.PROVINCE_ADMIN) where.city = req.query.city;
  if (req.query.type) where.type = req.query.type;
  if (req.query.level) where.level = req.query.level;
  if (req.query.isHandled !== undefined) where.isHandled = req.query.isHandled === 'true';
  const [list, total] = await Promise.all([
    prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.alert.count({ where }),
  ]);
  return paginated(res, list, total, page, pageSize);
});

router.post('/alerts/:alertId/handle', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), [
  body('handleNote').optional(),
], async (req: Request, res: Response) => {
  const alert = await prisma.alert.findUnique({ where: { id: req.params.alertId } });
  if (!alert) return fail(res, 404, '预警不存在');
  if (req.user!.role === UserRole.CITY_OPERATOR) {
    const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (op && alert.city !== op.managedCity) return fail(res, 403, '无权处理其他城市预警');
  }
  await prisma.alert.update({
    where: { id: alert.id },
    data: { isHandled: true, handledBy: req.user!.userId, handledAt: new Date(), handleNote: req.body.handleNote },
  });
  await createAuditLog(req.user!, AuditActions.ALERT_HANDLE, 'Alert', { targetId: alert.id, traceId: req.traceId });
  return ok(res, null, '预警已处理');
});

router.get('/stats/sla-overview', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), [
  query('city').optional(),
], async (req: Request, res: Response) => {
  const city = req.user!.role === UserRole.CITY_OPERATOR
    ? (await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } }))?.managedCity
    : (req.query.city as string);

  const where: any = city ? { applicantCity: city } : {};
  const now = new Date();
  const warnThreshold = new Date(now.getTime() + 24 * 3600 * 1000);

  const [totalOrders, processing, slaWarning, slaBreached, pendingCourier, pendingApproval, pendingOcr] = await Promise.all([
    prisma.order.count({ where: { ...where, createdAt: { gte: new Date(now.getTime() - 30 * 24 * 3600 * 1000) } } }),
    prisma.order.count({ where: { ...where, status: { notIn: [OrderStatus.COMPLETED as any, OrderStatus.CANCELLED as any, OrderStatus.REJECTED as any] } } }),
    prisma.order.count({ where: { ...where, status: { notIn: [OrderStatus.COMPLETED as any, OrderStatus.CANCELLED as any, OrderStatus.REJECTED as any] }, slaDeadline: { gt: now, lt: warnThreshold } } }),
    prisma.order.count({ where: { ...where, status: { notIn: [OrderStatus.COMPLETED as any, OrderStatus.CANCELLED as any, OrderStatus.REJECTED as any] }, slaDeadline: { lt: now } } }),
    prisma.order.count({ where: { ...where, status: { in: [OrderStatus.PENDING_PICKUP as any, OrderStatus.COURIER_ASSIGNED as any] } } }),
    prisma.order.count({ where: { ...where, status: { in: [OrderStatus.SUBMITTED_FOR_APPROVAL as any, OrderStatus.APPROVING as any] } } }),
    prisma.ocrRecord.count({ where: { status: { in: ['PENDING', 'NEED_MANUAL_REVIEW'] as any }, order: { ...(city ? { applicantCity: city } : {}) } } as any }),
  ]);

  return ok(res, {
    city,
    period: '最近30天',
    totalOrders, processing, slaWarning, slaBreached,
    pendingCourier, pendingApproval, pendingOcr,
    slaRate: totalOrders ? ((totalOrders - slaBreached) / totalOrders * 100).toFixed(2) + '%' : '0%',
  });
});

router.get('/city-configs', authMiddleware([UserRole.PROVINCE_ADMIN]), async (req: Request, res: Response) => {
  const configs = await prisma.cityServiceConfig.findMany({ orderBy: { cityCode: 'asc' } });
  return ok(res, configs);
});

router.get('/city-configs/:city', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), async (req: Request, res: Response) => {
  const cfg = await prisma.cityServiceConfig.findUnique({ where: { city: req.params.city } });
  if (!cfg) return fail(res, 404, '城市配置不存在');
  if (req.user!.role === UserRole.CITY_OPERATOR) {
    const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (op && cfg.city !== op.managedCity) return fail(res, 403, '无权查看');
  }
  return ok(res, cfg);
});

router.put('/city-configs/:city', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), async (req: Request, res: Response) => {
  let cfg = await prisma.cityServiceConfig.findUnique({ where: { city: req.params.city } });
  if (!cfg) return fail(res, 404, '城市配置不存在');
  if (req.user!.role === UserRole.CITY_OPERATOR) {
    const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (op && cfg.city !== op.managedCity) return fail(res, 403, '无权修改');
  }
  const {
    isVisaEnabled, isIdCardEnabled, isViolationEnabled, isInspectionEnabled,
    visaServiceFee, idCardServiceFee, violationServiceFee, inspectionServiceFee,
    courierFeeStandard, slaPickupMinutes, slaProcessHours, hotlinePhone, operatorNotice,
  } = req.body;
  const updated = await prisma.cityServiceConfig.update({
    where: { city: req.params.city },
    data: {
      isVisaEnabled, isIdCardEnabled, isViolationEnabled, isInspectionEnabled,
      visaServiceFee, idCardServiceFee, violationServiceFee, inspectionServiceFee,
      courierFeeStandard, slaPickupMinutes, slaProcessHours, hotlinePhone, operatorNotice,
    },
  });
  await createAuditLog(req.user!, AuditActions.CITY_CONFIG_UPDATE, 'CityServiceConfig', { targetId: updated.id, traceId: req.traceId });
  return ok(res, updated, '城市配置已更新');
});

router.get('/fund/accounts', authMiddleware([UserRole.PROVINCE_ADMIN]), async (req: Request, res: Response) => {
  const accounts = await prisma.fundAccount.findMany({ orderBy: { accountType: 'asc' } });
  const total = accounts.reduce((a, b) => ({
    balance: parseFloat(a.balance as any) + parseFloat(b.balance as any),
    frozen: parseFloat((a as any).frozen || 0) + parseFloat((b as any).frozenAmount || 0),
  }), { balance: 0, frozen: 0 });
  return ok(res, { accounts, summary: total });
});

router.get('/fund/transactions', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 50 }),
  query('accountId').optional(),
  query('transType').optional(),
  query('startDate').optional(),
  query('endDate').optional(),
], async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const where: any = {};
  if (req.query.accountId) where.accountId = req.query.accountId;
  if (req.query.transType) where.transType = req.query.transType;
  if (req.query.startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(req.query.startDate as string) };
  if (req.query.endDate) where.createdAt = { ...(where.createdAt || {}), lt: new Date(req.query.endDate as string) };

  if (req.user!.role === UserRole.CITY_OPERATOR) {
    const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } });
    if (op) {
      const cityAccounts = await prisma.fundAccount.findMany({ where: { managedCity: op.managedCity }, select: { id: true } });
      where.accountId = { in: cityAccounts.map(a => a.id) };
    }
  }

  const [list, total] = await Promise.all([
    prisma.fundTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { account: true, order: { select: { orderNo: true, orderType: true } } } }),
    prisma.fundTransaction.count({ where }),
  ]);
  return paginated(res, list, total, page, pageSize);
});

router.get('/orders/overview', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), [
  query('city').optional(),
  query('days').optional().isInt({ min: 1, max: 365 }),
], async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const start = new Date(); start.setDate(start.getDate() - days);
  const cityWhere = req.user!.role === UserRole.CITY_OPERATOR
    ? { applicantCity: (await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } }))?.managedCity }
    : (req.query.city ? { applicantCity: req.query.city as string } : {});

  const orders = await prisma.order.findMany({
    where: { ...cityWhere, createdAt: { gte: start } },
    select: { orderType: true, status: true, totalAmount: true, createdAt: true, applicantCity: true },
  });

  const byType = Object.values(OrderType).map(t => ({
    type: t,
    count: orders.filter(o => o.orderType === t).length,
    revenue: orders.filter(o => o.orderType === t && o.status === 'COMPLETED').reduce((a, b) => a + parseFloat(b.totalAmount as any), 0),
  }));
  const byStatus = Object.values(OrderStatus).map(s => ({
    status: s, count: orders.filter(o => o.status === s).length,
  }));

  const daily = Array.from({ length: days }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dayOrders = orders.filter(o => o.createdAt >= d && o.createdAt < next);
    return {
      date: d.toISOString().slice(0, 10),
      count: dayOrders.length,
      revenue: dayOrders.filter(o => o.status === 'COMPLETED').reduce((a, b) => a + parseFloat(b.totalAmount as any), 0),
    };
  });

  return ok(res, { days, byType, byStatus, daily, totalOrders: orders.length, totalRevenue: orders.filter(o => o.status === 'COMPLETED').reduce((a, b) => a + parseFloat(b.totalAmount as any), 0) });
});

router.get('/alerts/stats', authMiddleware([UserRole.CITY_OPERATOR, UserRole.PROVINCE_ADMIN]), async (req: Request, res: Response) => {
  const cityWhere = req.user!.role === UserRole.CITY_OPERATOR
    ? { city: (await prisma.operatorProfile.findUnique({ where: { userId: req.user!.userId } }))?.managedCity }
    : {};
  const [total, unhandled, byType, byLevel] = await Promise.all([
    prisma.alert.count({ where: cityWhere }),
    prisma.alert.count({ where: { ...cityWhere, isHandled: false } }),
    prisma.alert.groupBy({ by: ['type'], where: cityWhere, _count: true }),
    prisma.alert.groupBy({ by: ['level'], where: { ...cityWhere, isHandled: false }, _count: true }),
  ]);
  return ok(res, { total, unhandled, handleRate: total ? ((total - unhandled) / total * 100).toFixed(2) + '%' : '0%', byType, byLevel });
});

export default router;
