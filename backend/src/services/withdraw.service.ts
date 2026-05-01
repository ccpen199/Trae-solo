import { PrismaClient, WithdrawStatus, UserRole } from '@prisma/client';
import prisma from '../config/prisma';
import redis from '../config/redis';
import { cashOutEngine } from '../engines/cash-out';
import { fraudDetectionEngine } from '../engines/fraud-detection';
import { config } from '../config';

export interface CreateWithdrawParams {
  userId: string;
  amount: number;
  withdrawMethod: 'bank' | 'alipay';
  bankInfo?: {
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
  };
  alipayInfo?: {
    account: string;
  };
  ip?: string;
  deviceId?: string;
}

export interface WithdrawResult {
  success: boolean;
  withdrawId?: string;
  withdrawNo?: string;
  status?: WithdrawStatus;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  message?: string;
}

export class WithdrawService {
  private prisma: PrismaClient;
  private readonly RATE_LIMIT_PREFIX = 'withdraw:rate:';

  constructor() {
    this.prisma = prisma;
  }

  async createWithdraw(params: CreateWithdrawParams): Promise<WithdrawResult> {
    const { userId, amount, withdrawMethod, bankInfo, alipayInfo, ip, deviceId } = params;

    const fraudResult = await fraudDetectionEngine.detect({
      userId,
      ip,
      deviceId,
      eventType: 'WITHDRAW',
      eventData: {
        amount,
        withdrawMethod,
      },
    });

    if (fraudResult.riskLevel === 'CRITICAL') {
      return {
        success: false,
        message: '检测到异常操作，暂时无法提现',
      };
    }

    const riskResult = await cashOutEngine.preCheckWithdraw({
      userId,
      amount,
      withdrawMethod,
      bankInfo,
      alipayInfo,
      ip,
      deviceId,
    });

    if (!riskResult.passed) {
      return {
        success: false,
        riskLevel: riskResult.riskLevel,
        message: riskResult.riskFactors.join('; '),
      };
    }

    const account = await this.prisma.virtualAccount.findUnique({
      where: { userId },
    });

    if (!account || account.availableBalance.toNumber() < amount) {
      return {
        success: false,
        message: '余额不足',
      };
    }

    const withdrawNo = this.generateWithdrawNo();
    const fee = 0;
    const actualAmount = amount - fee;

    let status: WithdrawStatus = 'PENDING_REVIEW';

    if (riskResult.suggestedAction === 'ALLOW' && amount <= 50000) {
      status = 'APPROVED';
    }

    const withdraw = await this.prisma.$transaction(async (tx) => {
      const newWithdraw = await tx.withdrawRequest.create({
        data: {
          withdrawNo,
          userId,
          amount,
          fee,
          actualAmount,
          bankName: bankInfo?.bankName,
          bankAccount: bankInfo?.bankAccount,
          bankAccountName: bankInfo?.bankAccountName,
          alipayAccount: alipayInfo?.account,
          status,
        },
      });

      const balanceBefore = account.availableBalance.toNumber();
      const balanceAfter = balanceBefore - amount;

      await tx.virtualAccount.update({
        where: { userId },
        data: {
          availableBalance: { decrement: amount },
        },
      });

      await tx.commissionTransaction.create({
        data: {
          transactionNo: await this.generateTransactionNo(),
          userId,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          type: 'WITHDRAW',
          remark: `发起提现申请，金额${amount / 100}元`,
        },
      });

      const todayKey = `${this.RATE_LIMIT_PREFIX}${userId}:daily`;
      const todayCount = await redis.get(todayKey);
      const newCount = todayCount ? parseInt(todayCount) + 1 : 1;
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ttl = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
      await redis.setex(todayKey, ttl, newCount.toString());

      return newWithdraw;
    });

    return {
      success: true,
      withdrawId: withdraw.id,
      withdrawNo: withdraw.withdrawNo,
      status: withdraw.status,
      riskLevel: riskResult.riskLevel,
      message: status === 'APPROVED' ? '提现申请已自动审核通过' : '提现申请已提交，等待审核',
    };
  }

  async reviewWithdraw(params: {
    withdrawId: string;
    reviewerId: string;
    reviewerRole: UserRole;
    approved: boolean;
    remark?: string;
  }): Promise<WithdrawResult> {
    const withdraw = await this.prisma.withdrawRequest.findUnique({
      where: { id: params.withdrawId },
    });

    if (!withdraw) {
      return {
        success: false,
        message: '提现申请不存在',
      };
    }

    if (withdraw.status !== 'PENDING_REVIEW') {
      return {
        success: false,
        message: '当前状态不允许审核',
      };
    }

    const result = await cashOutEngine.processReview({
      withdrawId: params.withdrawId,
      reviewerId: params.reviewerId,
      reviewerRole: params.reviewerRole,
      approved: params.approved,
      remark: params.remark,
    });

    if (!result) {
      return {
        success: false,
        message: '审核失败',
      };
    }

    const updatedWithdraw = await this.prisma.withdrawRequest.findUnique({
      where: { id: params.withdrawId },
    });

    return {
      success: true,
      withdrawId: updatedWithdraw?.id,
      withdrawNo: updatedWithdraw?.withdrawNo,
      status: updatedWithdraw?.status,
      message: params.approved ? '审核通过' : '审核拒绝',
    };
  }

  async processPayment(withdrawId: string): Promise<WithdrawResult> {
    const withdraw = await this.prisma.withdrawRequest.findUnique({
      where: { id: withdrawId },
    });

    if (!withdraw) {
      return {
        success: false,
        message: '提现申请不存在',
      };
    }

    if (withdraw.status !== 'APPROVED') {
      return {
        success: false,
        message: '当前状态不允许打款',
      };
    }

    const result = await cashOutEngine.processPayment(withdrawId);

    if (!result.success) {
      return {
        success: false,
        message: result.failReason || '打款失败',
      };
    }

    const updatedWithdraw = await this.prisma.withdrawRequest.findUnique({
      where: { id: withdrawId },
    });

    return {
      success: true,
      withdrawId: updatedWithdraw?.id,
      withdrawNo: updatedWithdraw?.withdrawNo,
      status: updatedWithdraw?.status,
      message: '打款成功',
    };
  }

  private generateWithdrawNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `WD${dateStr}${timestamp}${random}`;
  }

  private async generateTransactionNo(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `TX${dateStr}${timestamp}${random}`;
  }

  async getUserWithdraws(userId: string, status?: WithdrawStatus) {
    const where: { userId: string; status?: WithdrawStatus } = { userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.withdrawRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingWithdraws() {
    return this.prisma.withdrawRequest.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            nickname: true,
          },
        },
      },
    });
  }
}

export const withdrawService = new WithdrawService();
