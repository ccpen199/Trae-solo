import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { checkAmlRules, calculateDailyWithdrawTotal } from '../services/risk-engine.js';
import type { DashboardSummary, TopicTrendItem, SalesTrendItem, ComplaintMetrics } from '@neighborhood/shared';

const router = Router();

router.use(authMiddleware, requireRole('platform_admin', 'tenant_admin'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalTenants,
      totalUsers,
      totalOrders,
      orderAgg,
      todayActiveUsers,
      todayNewUsers,
      todayTopicCount,
      pendingComplaints,
      pendingWithdrawals,
    ] = await Promise.all([
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { payAmount: true } }),
      prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.topic.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.complaint.count({ where: { status: 'submitted' } }),
      prisma.withdrawRecord.count({ where: { status: 'pending' } }),
    ]);

    const summary: DashboardSummary = {
      totalTenants,
      totalUsers,
      totalOrders,
      totalGMV: orderAgg._sum.payAmount ?? 0,
      todayActiveUsers,
      todayNewUsers,
      todayTopicCount,
      pendingComplaints,
      pendingWithdrawals,
      redpacketPoolBalance: 0,
      escrowBalance: 0,
    };

    return res.json({ code: 0, data: summary });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/health/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const [totalUsers, activeUsers, newUsers, topicCount, topicCommentCount, orderCount, orderAgg, complaintCount, complaintResolvedCount] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.user.count({ where: { tenantId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.topic.count({ where: { tenantId, status: 'published' } }),
      prisma.topicComment.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.order.aggregate({ where: { tenantId }, _sum: { payAmount: true } }),
      prisma.complaint.count({ where: { tenantId } }),
      prisma.complaint.count({ where: { tenantId, status: { in: ['resolved', 'closed'] } } }),
    ]);

    return res.json({
      code: 0,
      data: {
        tenantId,
        date: today,
        totalUsers,
        activeUsers,
        newUsers,
        topicCount,
        topicActiveUsers: 0,
        topicCommentCount,
        orderCount,
        orderTotalAmount: orderAgg._sum.payAmount ?? 0,
        orderConversionRate: totalUsers > 0 ? orderCount / totalUsers : 0,
        secondhandOrderCount: 0,
        secondhandTotalAmount: 0,
        complaintCount,
        complaintResolvedCount,
        avgFirstResponseMin: 0,
        avgResolutionMin: 0,
        redpacketGrantedAmount: 0,
        redpacketUsedAmount: 0,
        partnerSales: 0,
        partnerCommission: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/topic-trend', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const items: TopicTrendItem[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dateStr);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [count, activeUsers] = await Promise.all([
        prisma.topic.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: dayStart, lt: dayEnd } } }),
      ]);

      items.push({ date: dateStr, count, activeUsers });
    }

    return res.json({ code: 0, data: items });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/sales-trend', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const items: SalesTrendItem[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dateStr);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [orderCount, agg] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.order.aggregate({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
          _sum: { payAmount: true },
        }),
      ]);

      items.push({
        date: dateStr,
        orderCount,
        totalAmount: agg._sum.payAmount ?? 0,
        conversionRate: 0,
      });
    }

    return res.json({ code: 0, data: items });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/complaint-metrics', async (req, res, next) => {
  try {
    const [totalCount, pendingCount, resolvedCount] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: { in: ['submitted', 'processing'] } } }),
      prisma.complaint.count({ where: { status: { in: ['resolved', 'closed'] } } }),
    ]);

    const metrics: ComplaintMetrics = {
      totalCount,
      pendingCount,
      resolvedCount,
      avgFirstResponseMin: 0,
      avgResolutionMin: 0,
      within24hRate: 0,
    };

    return res.json({ code: 0, data: metrics });
  } catch (error) {
    next(error);
  }
});

router.get('/risk-alerts', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const isHandled = req.query.isHandled === 'true' ? true : req.query.isHandled === 'false' ? false : undefined;

    const where: Record<string, unknown> = {};
    if (isHandled !== undefined) where.isHandled = isHandled;

    const [alerts, total] = await Promise.all([
      prisma.riskAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.riskAlert.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: alerts, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.put('/risk-alerts/:id/handle', async (req, res, next) => {
  try {
    const { handleRemark } = req.body as { handleRemark: string };

    const alert = await prisma.riskAlert.findUnique({ where: { id: req.params.id } });
    if (!alert) {
      return res.status(404).json({ code: 404, message: 'Risk alert not found' });
    }

    await prisma.riskAlert.update({
      where: { id: req.params.id },
      data: {
        isHandled: true,
        handlerId: req.user!.id,
        handledAt: new Date(),
        handleRemark,
      },
    });

    return res.json({ code: 0, data: null });
  } catch (error) {
    next(error);
  }
});

router.get('/trace-logs/:topicId', async (req, res, next) => {
  try {
    const logs = await prisma.topicTraceLog.findMany({
      where: { topicId: req.params.topicId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ code: 0, data: logs });
  } catch (error) {
    next(error);
  }
});

router.get('/sensitive-word-logs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [logs, total] = await Promise.all([
      prisma.sensitiveWordHitLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sensitiveWordHitLog.count(),
    ]);

    return res.json({ code: 0, data: { list: logs, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/risk/redpacket-pool', async (req, res, next) => {
  try {
    const totalGranted = await prisma.redPacket.aggregate({
      _sum: { amount: true },
    });

    const totalUsed = await prisma.redPacket.aggregate({
      where: { status: 'used' },
      _sum: { amount: true },
    });

    const totalExpired = await prisma.redPacket.aggregate({
      where: { status: 'expired' },
      _sum: { amount: true },
    });

    return res.json({
      code: 0,
      data: {
        totalGranted: totalGranted._sum.amount ?? 0,
        totalUsed: totalUsed._sum.amount ?? 0,
        totalExpired: totalExpired._sum.amount ?? 0,
        poolBalance: (totalGranted._sum.amount ?? 0) - (totalUsed._sum.amount ?? 0) - (totalExpired._sum.amount ?? 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/risk/withdraw-stats', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingCount, processingCount, todayTotal, todayCount] = await Promise.all([
      prisma.withdrawRecord.count({ where: { status: 'pending' } }),
      prisma.withdrawRecord.count({ where: { status: 'processing' } }),
      prisma.withdrawRecord.aggregate({
        where: { status: 'success', createdAt: { gte: today } },
        _sum: { amount: true },
      }),
      prisma.withdrawRecord.count({
        where: { status: 'success', createdAt: { gte: today } },
      }),
    ]);

    return res.json({
      code: 0,
      data: {
        pendingCount,
        processingCount,
        todayTotal: todayTotal._sum.amount ?? 0,
        todayCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/risk/aml-check/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await checkAmlRules(userId, 0);
    return res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
