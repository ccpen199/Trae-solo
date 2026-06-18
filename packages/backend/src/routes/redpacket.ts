import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkWithdrawRisk } from '../services/risk-engine.js';

const router = Router();

const withdrawSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['wechat', 'alipay', 'bank']),
  paymentAccount: z.string().min(1),
  paymentAccountName: z.string().optional(),
  bankName: z.string().optional(),
});

router.get('/redpackets', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (status) where.status = status;

    const [redpackets, total] = await Promise.all([
      prisma.redPacket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.redPacket.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: redpackets, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/wallet', authMiddleware, async (req, res, next) => {
  try {
    const wallet = await prisma.userWallet.findUnique({ where: { userId: req.user!.id } });

    if (!wallet) {
      return res.status(404).json({ code: 404, message: 'Wallet not found' });
    }

    return res.json({ code: 0, data: wallet });
  } catch (error) {
    next(error);
  }
});

router.get('/wallet/transactions', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.walletTransaction.count({ where: { userId: req.user!.id } }),
    ]);

    return res.json({ code: 0, data: { list: transactions, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.post('/wallet/withdraw', authMiddleware, validate(withdrawSchema), async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentAccount, paymentAccountName, bankName } = req.body;

    const riskCheck = await checkWithdrawRisk(req.user!.id, amount);
    if (!riskCheck.allowed) {
      return res.status(400).json({ code: 400, message: riskCheck.reason ?? 'Withdrawal not allowed' });
    }

    const wallet = await prisma.userWallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      return res.status(404).json({ code: 404, message: 'Wallet not found' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ code: 400, message: 'Insufficient balance' });
    }

    const fee = Math.round(amount * 0.01 * 100) / 100;
    const actualAmount = amount - fee;

    const withdrawRecord = await prisma.$transaction(async (tx) => {
      await tx.userWallet.update({
        where: { userId: req.user!.id },
        data: {
          balance: { decrement: amount },
          frozenAmount: { increment: amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.id,
          amount: -amount,
          balanceAfter: wallet.balance - amount,
          type: 'freeze',
          source: 'withdraw',
          description: `Withdrawal request: ${amount}`,
        },
      });

      return tx.withdrawRecord.create({
        data: {
          userId: req.user!.id,
          walletId: wallet.id,
          tenantId: req.user!.tenantId,
          amount,
          fee,
          actualAmount,
          status: 'pending',
          paymentMethod,
          paymentAccount,
          paymentAccountName,
          bankName,
          riskFlag: riskCheck.reason !== undefined,
          riskReason: riskCheck.reason,
          amlCheckPassed: true,
        },
      });
    });

    return res.status(201).json({ code: 0, data: withdrawRecord });
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/sign-in', authMiddleware, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const existing = await prisma.signInRecord.findFirst({
      where: { userId: req.user!.id, signInDate: today },
    });

    if (existing) {
      return res.status(400).json({ code: 400, message: 'Already signed in today' });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayRecord = await prisma.signInRecord.findFirst({
      where: { userId: req.user!.id, signInDate: yesterday },
    });

    const continuousDays = yesterdayRecord ? yesterdayRecord.continuousDays + 1 : 1;
    const rewardAmount = Math.min(0.1 * continuousDays, 1);

    const signInRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.signInRecord.create({
        data: {
          userId: req.user!.id,
          tenantId: req.user!.tenantId,
          signInDate: today,
          continuousDays,
          rewardAmount,
        },
      });

      await tx.redPacket.create({
        data: {
          userId: req.user!.id,
          tenantId: req.user!.tenantId,
          source: 'sign_in',
          sourceId: record.id,
          amount: rewardAmount,
          remainingAmount: rewardAmount,
          status: 'unused',
          description: `Sign-in reward: day ${continuousDays}`,
        },
      });

      return record;
    });

    return res.status(201).json({ code: 0, data: signInRecord });
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/invite', authMiddleware, async (req, res, next) => {
  try {
    const { inviteeId } = req.body as { inviteeId: string };

    const existing = await prisma.inviteRecord.findFirst({
      where: { inviterId: req.user!.id, inviteeId },
    });

    if (existing) {
      return res.status(400).json({ code: 400, message: 'Already recorded this invite' });
    }

    const rewardAmount = 0.5;

    const inviteRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.inviteRecord.create({
        data: {
          inviterId: req.user!.id,
          inviteeId,
          tenantId: req.user!.tenantId,
          rewardAmount,
          rewardGranted: true,
          rewardGrantedAt: new Date(),
        },
      });

      await tx.redPacket.create({
        data: {
          userId: req.user!.id,
          tenantId: req.user!.tenantId,
          source: 'invite',
          sourceId: record.id,
          amount: rewardAmount,
          remainingAmount: rewardAmount,
          status: 'unused',
          description: 'Invite friend reward',
        },
      });

      return record;
    });

    return res.status(201).json({ code: 0, data: inviteRecord });
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/review', authMiddleware, async (req, res, next) => {
  try {
    const { orderId, content, rating } = req.body as { orderId: string; content: string; rating: number };

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id, status: 'completed' },
    });

    if (!order) {
      return res.status(400).json({ code: 400, message: 'Order not found or not completed' });
    }

    const rewardAmount = 0.3;

    const taskRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.userTaskRecord.create({
        data: {
          userId: req.user!.id,
          taskId: 'review_task',
          taskType: 'write_review',
          completed: true,
          completedAt: new Date(),
          rewardGranted: true,
          rewardGrantedAt: new Date(),
          metadata: { orderId, content, rating },
        },
      });

      await tx.redPacket.create({
        data: {
          userId: req.user!.id,
          tenantId: req.user!.tenantId,
          source: 'review',
          sourceId: record.id,
          amount: rewardAmount,
          remainingAmount: rewardAmount,
          status: 'unused',
          description: 'Review reward',
        },
      });

      return record;
    });

    return res.status(201).json({ code: 0, data: taskRecord });
  } catch (error) {
    next(error);
  }
});

router.get('/tasks', authMiddleware, async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const tasks = await prisma.taskDefinition.findMany({
      where: { isActive: true, OR: [{ tenantId }, { tenantId: null }] },
    });

    return res.json({ code: 0, data: tasks });
  } catch (error) {
    next(error);
  }
});

router.get('/tasks/records', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [records, total] = await Promise.all([
      prisma.userTaskRecord.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.userTaskRecord.count({ where: { userId: req.user!.id } }),
    ]);

    return res.json({ code: 0, data: { list: records, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

export default router;
