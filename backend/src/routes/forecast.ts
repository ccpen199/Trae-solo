import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import securityVault from '../engines/security-vault';
import cashPosition from '../engines/cash-position';

const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  FINANCIAL_MANAGER: 'FINANCIAL_MANAGER',
  CFO: 'CFO',
  AUDITOR: 'AUDITOR',
};

const router = Router();

router.get(
  '/',
  authMiddleware([ROLES.CFO, ROLES.FINANCIAL_MANAGER, ROLES.AUDITOR, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { accountId } = req.query;

      if (!accountId) {
        const accounts = await prisma.bankAccount.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, accountName: true, accountNumber: true },
        });

        if (accounts.length === 0) {
          return res.json({
            success: true,
            data: null,
          });
        }

        const latestForecast = await prisma.cashForecast.findFirst({
          where: { bankAccountId: accounts[0].id },
          orderBy: { createdAt: 'desc' },
          include: {
            items: { orderBy: { forecastDate: 'asc' } },
          },
        });

        return res.json({
          success: true,
          data: latestForecast ? {
            ...latestForecast,
            items: latestForecast.items.map((item: any) => ({
              ...item,
              openingBalance: Number(item.openingBalance),
              projectedInflow: Number(item.projectedInflow),
              projectedOutflow: Number(item.projectedOutflow),
              netAmount: Number(item.netAmount),
              closingBalance: Number(item.closingBalance),
            })),
          } : null,
        });
      }

      const latestForecast = await prisma.cashForecast.findFirst({
        where: { bankAccountId: accountId as string },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { orderBy: { forecastDate: 'asc' } },
        },
      });

      res.json({
        success: true,
        data: latestForecast ? {
          ...latestForecast,
          items: latestForecast.items.map((item: any) => ({
            ...item,
            openingBalance: Number(item.openingBalance),
            projectedInflow: Number(item.projectedInflow),
            projectedOutflow: Number(item.projectedOutflow),
            netAmount: Number(item.netAmount),
            closingBalance: Number(item.closingBalance),
          })),
        } : null,
      });
    } catch (error) {
      console.error('Get forecast error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取预测数据失败' 
      });
    }
  }
);

router.get(
  '/history',
  authMiddleware([ROLES.CFO, ROLES.FINANCIAL_MANAGER, ROLES.AUDITOR, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit = '10' } = req.query;

      const history = await prisma.cashForecast.findMany({
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          bankAccount: { select: { id: true, accountName: true } },
          _count: { select: { items: true } },
        },
      });

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Get forecast history error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取预测历史失败' 
      });
    }
  }
);

router.post(
  '/generate',
  authMiddleware([ROLES.CFO, ROLES.FINANCIAL_MANAGER, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { accountId, periodType, periodCount } = req.body;

      if (!accountId) {
        return res.status(400).json({ 
          success: false, 
          error: '请选择要预测的账户' 
        });
      }

      const account = await prisma.bankAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return res.status(404).json({ 
          success: false, 
          error: '账户不存在' 
        });
      }

      const config: any = {};
      if (periodType) config.periodType = periodType;
      if (periodCount) config.periodCount = parseInt(periodCount);

      const result = await cashPosition.generateForecast(accountId, config);

      await securityVault.recordAuditLog({
        userId: req.user!.id!,
        action: 'CREATE',
        module: 'FORECAST',
        targetType: 'CashForecast',
        targetId: result.forecastId,
        description: `生成资金预测 - ${account.accountName}`,
        status: 'SUCCESS',
        riskLevel: 'LOW',
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Generate forecast error:', error);
      res.status(500).json({ 
        success: false, 
        error: '生成预测失败' 
      });
    }
  }
);

router.get(
  '/:id',
  authMiddleware([ROLES.CFO, ROLES.FINANCIAL_MANAGER, ROLES.AUDITOR, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const forecast = await prisma.cashForecast.findUnique({
        where: { id },
        include: {
          items: { orderBy: { forecastDate: 'asc' } },
          report: true,
        },
      });

      if (!forecast) {
        return res.status(404).json({ 
          success: false, 
          error: '预测记录不存在' 
        });
      }

      res.json({
        success: true,
        data: {
          ...forecast,
          items: forecast.items.map((item: any) => ({
            ...item,
            openingBalance: Number(item.openingBalance),
            projectedInflow: Number(item.projectedInflow),
            projectedOutflow: Number(item.projectedOutflow),
            netAmount: Number(item.netAmount),
            closingBalance: Number(item.closingBalance),
          })),
        },
      });
    } catch (error) {
      console.error('Get forecast error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取预测详情失败' 
      });
    }
  }
);

export default router;
