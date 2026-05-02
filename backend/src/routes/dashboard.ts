import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  FINANCIAL_MANAGER: 'FINANCIAL_MANAGER',
  CFO: 'CFO',
  AUDITOR: 'AUDITOR',
};

const router = Router();

router.get(
  '/summary',
  authMiddleware(),
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        accounts,
        latestSnapshot,
        todayTransactions,
        pendingPayments,
        recentReconciliations,
        pendingExceptions,
      ] = await Promise.all([
        prisma.bankAccount.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            accountNumber: true,
            accountName: true,
            bankName: true,
            currentBalance: true,
            availableBalance: true,
            currency: true,
            lastSyncTime: true,
          },
        }),
        prisma.cashPositionSnapshot.findFirst({
          orderBy: { snapshotTime: 'desc' },
        }),
        prisma.transaction.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.paymentRequest.count({
          where: {
            status: {
              in: ['DRAFT', 'PENDING_APPROVAL'],
            },
          },
        }),
        prisma.reconciliation.findMany({
          take: 5,
          orderBy: { reconDate: 'desc' },
          select: {
            id: true,
            reconNumber: true,
            reconDate: true,
            status: true,
            matchedCount: true,
            unmatchedCount: true,
            exceptionCount: true,
          },
        }),
        prisma.exceptionReport.count({
          where: {
            status: {
              notIn: ['RESOLVED', 'APPROVED'],
            },
          },
        }),
      ]);

      let totalBalance = 0;
      let totalAvailable = 0;
      for (const account of accounts) {
        totalBalance += Number(account.currentBalance);
        totalAvailable += Number(account.availableBalance);
      }

      const summary = {
        cashPosition: {
          totalBalance: latestSnapshot ? Number(latestSnapshot.totalBalance) : totalBalance,
          totalAvailable: latestSnapshot ? Number(latestSnapshot.totalAvailable) : totalAvailable,
          accountCount: accounts.length,
          lastUpdated: latestSnapshot?.snapshotTime || null,
        },
        accounts: accounts.map((a) => ({
          ...a,
          currentBalance: Number(a.currentBalance),
          availableBalance: Number(a.availableBalance),
        })),
        activities: {
          todayTransactions,
          pendingPayments,
          pendingExceptions,
        },
        recentReconciliations,
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Get dashboard summary error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取看板摘要失败' 
      });
    }
  }
);

router.get(
  '/cash-trend',
  authMiddleware([ROLES.CFO, ROLES.FINANCIAL_MANAGER, ROLES.AUDITOR, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { days = '30' } = req.query;
      const limitDays = parseInt(days as string);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - limitDays);

      const [balanceHistory, forecasts] = await Promise.all([
        prisma.balanceHistory.findMany({
          where: {
            recordTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            bankAccount: {
              select: {
                accountName: true,
                accountNumber: true,
              },
            },
          },
          orderBy: { recordTime: 'asc' },
        }),
        prisma.cashForecastItem.findMany({
          where: {
            forecastDate: {
              gte: new Date(),
            },
          },
          orderBy: { forecastDate: 'asc' },
          take: 10,
        }),
      ]);

      const dailyAggregate = new Map<string, { date: string; balance: number; available: number }>();

      for (const record of balanceHistory) {
        const dateKey = record.recordTime.toISOString().split('T')[0];
        if (!dailyAggregate.has(dateKey)) {
          dailyAggregate.set(dateKey, {
            date: dateKey,
            balance: 0,
            available: 0,
          });
        }
        const agg = dailyAggregate.get(dateKey)!;
        agg.balance += Number(record.balance);
        agg.available += Number(record.availableBalance);
      }

      const trendData = Array.from(dailyAggregate.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      res.json({
        success: true,
        data: {
          historical: trendData,
          forecast: forecasts.map((f) => ({
            date: f.forecastDate.toISOString().split('T')[0],
            closingBalance: Number(f.closingBalance),
            netAmount: Number(f.netAmount),
            confidenceLevel: f.confidenceLevel,
          })),
        },
      });
    } catch (error) {
      console.error('Get cash trend error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取资金趋势失败' 
      });
    }
  }
);

router.get(
  '/payment-stats',
  authMiddleware([ROLES.CFO, ROLES.FINANCIAL_MANAGER, ROLES.AUDITOR, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const [byStatus, recentRequests] = await Promise.all([
        prisma.paymentRequest.groupBy({
          by: ['status'],
          _count: true,
          _sum: {
            amount: true,
          },
        }),
        prisma.paymentRequest.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            requester: { select: { username: true } },
            bankAccount: { select: { accountName: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          byStatus: byStatus.map((s) => ({
            status: s.status,
            count: s._count,
            totalAmount: s._sum.amount ? Number(s._sum.amount) : 0,
          })),
          recentRequests: recentRequests.map((r) => ({
            ...r,
            amount: Number(r.amount),
          })),
        },
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取付款统计失败' 
      });
    }
  }
);

export default router;
