import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import securityVault from '../engines/security-vault';
import bankConnector from '../engines/bank-connector';

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
      const { page = '1', pageSize = '20', status, bankName } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

      const where: any = {};
      if (status) where.status = status;
      if (bankName) where.bankName = { contains: bankName as string };

      const [accounts, total] = await Promise.all([
        prisma.bankAccount.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(pageSize as string),
        }),
        prisma.bankAccount.count({ where }),
      ]);

      await securityVault.recordAuditLog({
        userId: req.user!.userId,
        action: 'VIEW',
        module: 'BANK_ACCOUNT',
        targetType: 'BankAccount',
        status: 'SUCCESS',
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: {
          accounts,
          pagination: {
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize as string)),
          },
        },
      });
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取账户列表失败' 
      });
    }
  }
);

router.get(
  '/:id',
  authMiddleware(),
  [param('id').notEmpty().withMessage('账户ID不能为空')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { id } = req.params;

      const account = await prisma.bankAccount.findUnique({
        where: { id },
        include: {
          balanceHistory: { orderBy: { recordTime: 'desc' }, take: 10 },
          transactions: { orderBy: { transactionDate: 'desc' }, take: 20 },
        },
      });

      if (!account) {
        return res.status(404).json({ 
          success: false, 
          error: '账户不存在' 
        });
      }

      await securityVault.recordAuditLog({
        userId: req.user!.userId,
        action: 'VIEW',
        module: 'BANK_ACCOUNT',
        targetType: 'BankAccount',
        targetId: id,
        status: 'SUCCESS',
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error('Get account error:', error);
      res.status(500).json({ 
        success: false, 
        error: '获取账户详情失败' 
      });
    }
  }
);

router.post(
  '/',
  authMiddleware([ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.ADMIN]),
  [
    body('accountNumber').notEmpty().withMessage('账号不能为空'),
    body('accountName').notEmpty().withMessage('账户名称不能为空'),
    body('bankName').notEmpty().withMessage('银行名称不能为空'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const {
        accountNumber,
        accountName,
        bankName,
        bankCode,
        accountType,
        currency,
        initialBalance,
      } = req.body;

      const existingAccount = await prisma.bankAccount.findUnique({
        where: { accountNumber },
      });

      if (existingAccount) {
        return res.status(400).json({ 
          success: false, 
          error: '该账号已存在' 
        });
      }

      const initialBal = parseFloat(initialBalance || '0');

      const account = await prisma.bankAccount.create({
        data: {
          accountNumber,
          accountName,
          bankName,
          bankCode,
          accountType: accountType || 'GENERAL',
          currency: currency || 'CNY',
          status: 'ACTIVE',
          initialBalance: initialBal,
          currentBalance: initialBal,
          availableBalance: initialBal,
          createdBy: req.user!.userId,
        },
      });

      await prisma.balanceHistory.create({
        data: {
          bankAccountId: account.id,
          balance: initialBal,
          availableBalance: initialBal,
          recordTime: new Date(),
          source: 'MANUAL_ADJUST',
        },
      });

      await securityVault.recordAuditLog({
        userId: req.user!.userId,
        action: 'CREATE',
        module: 'BANK_ACCOUNT',
        targetType: 'BankAccount',
        targetId: account.id,
        newValue: JSON.stringify({
          accountNumber,
          accountName,
          bankName,
          accountType,
          initialBalance,
        }),
        status: 'SUCCESS',
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({ 
        success: false, 
        error: '创建账户失败' 
      });
    }
  }
);

router.post(
  '/:id/sync',
  authMiddleware([ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.ADMIN]),
  [param('id').notEmpty().withMessage('账户ID不能为空')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { id } = req.params;

      const account = await prisma.bankAccount.findUnique({
        where: { id },
      });

      if (!account) {
        return res.status(404).json({ 
          success: false, 
          error: '账户不存在' 
        });
      }

      const [balanceResult, transactionResult] = await Promise.all([
        bankConnector.syncAccountBalance(id, account.accountNumber),
        bankConnector.syncAccountTransactions(id, account.accountNumber),
      ]);

      await securityVault.recordAuditLog({
        userId: req.user!.userId,
        action: 'SYNC',
        module: 'BANK_ACCOUNT',
        targetType: 'BankAccount',
        targetId: id,
        newValue: JSON.stringify({
          balanceUpdated: balanceResult.balanceUpdated,
          newTransactions: transactionResult.newTransactions,
        }),
        status: balanceResult.success ? 'SUCCESS' : 'FAILED',
        errorMessage: balanceResult.errorMessage,
        ipAddress: req.ip,
      });

      res.json({
        success: balanceResult.success,
        data: {
          balanceUpdated: balanceResult.balanceUpdated,
          newTransactions: transactionResult.newTransactions,
          syncedAt: balanceResult.syncedAt,
        },
      });
    } catch (error) {
      console.error('Sync account error:', error);
      res.status(500).json({ 
        success: false, 
        error: '同步账户失败' 
      });
    }
  }
);

export default router;
