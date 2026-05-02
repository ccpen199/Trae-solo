import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import securityVault from '../engines/security-vault';
import cashReconcile from '../engines/cash-reconcile';

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
  authMiddleware(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = '1', pageSize = '20', status } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

      const where: any = {};
      if (status) where.status = status;

      const [reconciliations, total] = await Promise.all([
        prisma.reconciliation.findMany({
          where,
          include: {
            initiator: { select: { id: true, username: true, realName: true } },
            exceptionReport: true,
          },
          orderBy: { reconDate: 'desc' },
          skip,
          take: parseInt(pageSize as string),
        }),
        prisma.reconciliation.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          reconciliations,
          pagination: {
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize as string)),
          },
        },
      });
    } catch (error) {
      console.error('Get reconciliations error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取对账记录列表失败' 
      });
    }
  }
);

router.get(
  '/exceptions',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN, ROLES.AUDITOR]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = '1', pageSize = '20', status } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

      const where: any = {};
      if (status) where.status = status;

      const [reports, total] = await Promise.all([
        prisma.exceptionReport.findMany({
          where,
          include: {
            reconciliation: true,
            transaction: true,
          },
          orderBy: { generatedAt: 'desc' },
          skip,
          take: parseInt(pageSize as string),
        }),
        prisma.exceptionReport.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize as string)),
          },
        },
      });
    } catch (error) {
      console.error('Get exceptions error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取异常报告列表失败' 
      });
    }
  }
);

router.get(
  '/unmatched',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN, ROLES.AUDITOR]),
  async (req: AuthRequest, res: Response) => {
    try {
      const [unmatchedTransactions, unmatchedErpDocuments] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            isReconciled: false,
            reconciliationItems: { none: {} },
          },
          include: {
            bankAccount: { select: { id: true, accountName: true, accountNumber: true } },
          },
          orderBy: { transactionDate: 'desc' },
          take: 50,
        }),
        prisma.erpDocument.findMany({
          where: {
            reconcileStatus: { not: 'MATCHED' },
          },
          include: {
            bankAccount: { select: { id: true, accountName: true } },
          },
          orderBy: { documentDate: 'desc' },
          take: 50,
        }),
      ]);

      res.json({
        success: true,
        data: {
          transactions: unmatchedTransactions.map((t) => ({
            ...t,
            amount: Number(t.amount),
          })),
          erpDocuments: unmatchedErpDocuments.map((d) => ({
            ...d,
            amount: Number(d.amount),
          })),
        },
      });
    } catch (error) {
      console.error('Get unmatched items error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取未匹配项失败' 
      });
    }
  }
);

router.get(
  '/:id',
  authMiddleware(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id },
        include: {
          initiator: { select: { id: true, username: true, realName: true } },
          items: {
            include: {
              transaction: true,
              erpDocument: true,
              exceptionReport: true,
            },
          },
          exceptionReport: true,
        },
      });

      if (!reconciliation) {
        return res.status(404).json({ 
          success: false, 
          error: '对账记录不存在' 
        });
      }

      res.json({
        success: true,
        data: reconciliation,
      });
    } catch (error) {
      console.error('Get reconciliation error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取对账记录详情失败' 
      });
    }
  }
);

router.post(
  '/run',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { bankAccountId, startDate, endDate } = req.body;

      if (!bankAccountId) {
        return res.status(400).json({ 
          success: false, 
          error: '请选择要对账的账户' 
        });
      }

      const account = await prisma.bankAccount.findUnique({
        where: { id: bankAccountId },
      });

      if (!account) {
        return res.status(404).json({ 
          success: false, 
          error: '账户不存在' 
        });
      }

      const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      const result = await cashReconcile.performReconciliation(bankAccountId, start, end);

      await securityVault.recordAuditLog({
        userId: req.user!.id!,
        action: 'SYNC',
        module: 'RECONCILIATION',
        targetType: 'Reconciliation',
        targetId: result.reconId,
        description: `执行对账 - ${account.accountName}`,
        newValue: JSON.stringify({
          matchedCount: result.matchedCount,
          unmatchedCount: result.unmatchedCount,
          exceptionCount: result.exceptionCount,
        }),
        status: 'SUCCESS',
        riskLevel: 'MEDIUM',
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Run reconciliation error:', error);
      res.status(500).json({ 
        success: false, 
        error: '执行对账失败' 
      });
    }
  }
);

router.post(
  '/manual-match',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId, erpDocumentId } = req.body;

      if (!transactionId || !erpDocumentId) {
        return res.status(400).json({ 
          success: false, 
          error: 'transactionId 和 erpDocumentId 不能为空' 
        });
      }

      const [transaction, erpDocument] = await Promise.all([
        prisma.transaction.findUnique({ where: { id: transactionId } }),
        prisma.erpDocument.findUnique({ where: { id: erpDocumentId } }),
      ]);

      if (!transaction || !erpDocument) {
        return res.status(404).json({ 
          success: false, 
          error: '交易或ERP单据不存在' 
        });
      }

      const existingRecon = await prisma.reconciliation.findFirst({
        where: {
          bankAccountId: transaction.bankAccountId,
        },
        orderBy: { createdAt: 'desc' },
      });

      let reconciliationId: string;
      
      if (!existingRecon) {
        const newRecon = await prisma.reconciliation.create({
          data: {
            bankAccountId: transaction.bankAccountId,
            reconDate: new Date(),
            reconNumber: `RC-${Date.now().toString()}`,
            status: 'COMPLETED',
          },
        });
        reconciliationId = newRecon.id;
      } else {
        reconciliationId = existingRecon.id;
      }

      await prisma.reconciliationItem.create({
        data: {
          reconciliationId,
          itemType: 'MATCHED',
          transactionId,
          erpDocumentId,
          matchRule: 'MANUAL',
          matchScore: 100,
          matchedAmount: transaction.amount,
          difference: 0,
          description: '手工匹配',
        },
      });

      await Promise.all([
        prisma.transaction.update({
          where: { id: transactionId },
          data: { isReconciled: true, reconciledAt: new Date() },
        }),
        prisma.erpDocument.update({
          where: { id: erpDocumentId },
          data: { reconcileStatus: 'MATCHED', reconciledAt: new Date() },
        }),
      ]);

      await securityVault.recordAuditLog({
        userId: req.user!.id!,
        action: 'UPDATE',
        module: 'RECONCILIATION',
        targetType: 'ReconciliationItem',
        targetId: reconciliationId,
        description: '手工匹配交易',
        newValue: JSON.stringify({
          transactionId,
          erpDocumentId,
        }),
        status: 'SUCCESS',
        riskLevel: 'MEDIUM',
      });

      res.json({
        success: true,
        data: {
          message: '手工匹配成功',
          reconciliationId,
        },
      });
    } catch (error) {
      console.error('Manual match error:', error);
      res.status(500).json({ 
        success: false, 
        error: '手工匹配失败' 
      });
    }
  }
);

router.post(
  '/exceptions/:reportId/resolve',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { reportId } = req.params;
      const { resolution, remark } = req.body;

      const report = await prisma.exceptionReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        return res.status(404).json({ 
          success: false, 
          error: '异常报告不存在' 
        });
      }

      const updatedReport = await prisma.exceptionReport.update({
        where: { id: reportId },
        data: {
          status: 'RESOLVED',
          resolution,
          resolvedBy: req.user!.id!,
          resolvedAt: new Date(),
        },
      });

      await securityVault.recordAuditLog({
        userId: req.user!.id!,
        action: 'UPDATE',
        module: 'RECONCILIATION',
        targetType: 'ExceptionReport',
        targetId: reportId,
        description: `解决异常: ${resolution}`,
        status: 'SUCCESS',
        riskLevel: 'MEDIUM',
      });

      res.json({
        success: true,
        data: updatedReport,
      });
    } catch (error) {
      console.error('Resolve exception error:', error);
      res.status(500).json({ 
        success: false, 
        error: '解决异常失败' 
      });
    }
  }
);

router.get(
  '/match-rules',
  authMiddleware([ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.AUDITOR, ROLES.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    try {
      const rules = cashReconcile.getMatchRules();

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      console.error('Get match rules error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取匹配规则失败' 
      });
    }
  }
);

export default router;
