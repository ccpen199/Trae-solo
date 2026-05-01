import { PrismaClient, UserRole, WithdrawStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import redis from '../../config/redis';
import { config } from '../../config';

export interface WithdrawCheckContext {
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

export interface WithdrawRiskResult {
  passed: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
  suggestedAction: 'ALLOW' | 'REVIEW' | 'REJECT';
  message?: string;
}

export interface WithdrawReviewContext {
  withdrawId: string;
  reviewerId: string;
  reviewerRole: UserRole;
  approved: boolean;
  remark?: string;
}

export interface WithdrawPaymentResult {
  success: boolean;
  paymentNo?: string;
  paymentTime?: Date;
  failReason?: string;
}

export class CashOutEngine {
  private prisma: PrismaClient;
  private readonly RISK_PREFIX = 'cashout:risk:';
  private readonly RATE_LIMIT_PREFIX = 'cashout:rate:';

  constructor() {
    this.prisma = prisma;
  }

  async preCheckWithdraw(context: WithdrawCheckContext): Promise<WithdrawRiskResult> {
    const riskFactors: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    const amountCheck = this.checkAmount(context.amount);
    if (!amountCheck.valid) {
      riskFactors.push(amountCheck.reason!);
      riskLevel = 'HIGH';
    }

    const balanceCheck = await this.checkBalance(context.userId, context.amount);
    if (!balanceCheck.valid) {
      riskFactors.push(balanceCheck.reason!);
      riskLevel = 'HIGH';
    }

    const rateLimitCheck = await this.checkRateLimit(context.userId);
    if (!rateLimitCheck.valid) {
      riskFactors.push(rateLimitCheck.reason!);
      riskLevel = 'MEDIUM';
    }

    const methodCheck = this.checkWithdrawMethod(context);
    if (!methodCheck.valid) {
      riskFactors.push(methodCheck.reason!);
      riskLevel = 'HIGH';
    }

    const userRiskCheck = await this.checkUserRisk(context.userId);
    if (userRiskCheck.riskFactors.length > 0) {
      riskFactors.push(...userRiskCheck.riskFactors);
      riskLevel = this.maxRiskLevel(riskLevel, userRiskCheck.riskLevel);
    }

    const ipDeviceCheck = await this.checkIpDevice(context.userId, context.ip, context.deviceId);
    if (ipDeviceCheck.riskFactors.length > 0) {
      riskFactors.push(...ipDeviceCheck.riskFactors);
      riskLevel = this.maxRiskLevel(riskLevel, ipDeviceCheck.riskLevel);
    }

    let suggestedAction: 'ALLOW' | 'REVIEW' | 'REJECT';
    if (riskLevel === 'HIGH') {
      suggestedAction = riskFactors.includes('余额不足') || riskFactors.some(f => f.includes('金额'))
        ? 'REJECT'
        : 'REVIEW';
    } else if (riskLevel === 'MEDIUM') {
      suggestedAction = 'REVIEW';
    } else {
      suggestedAction = 'ALLOW';
    }

    const passed = suggestedAction !== 'REJECT';

    await this.recordRiskAssessment(context.userId, {
      riskLevel,
      riskFactors,
      suggestedAction,
    });

    return {
      passed,
      riskLevel,
      riskFactors,
      suggestedAction,
      message: passed ? '提现申请已提交' : '提现申请被拒绝',
    };
  }

  private checkAmount(amount: number): { valid: boolean; reason?: string } {
    if (amount <= 0) {
      return { valid: false, reason: '提现金额必须大于0' };
    }
    if (amount < config.MIN_WITHDRAW_AMOUNT) {
      return { valid: false, reason: `提现金额不能小于最低限额${config.MIN_WITHDRAW_AMOUNT / 100}元` };
    }
    if (amount > config.MAX_WITHDRAW_AMOUNT) {
      return { valid: false, reason: `提现金额不能超过最高限额${config.MAX_WITHDRAW_AMOUNT / 100}元` };
    }
    return { valid: true };
  }

  private async checkBalance(
    userId: string,
    amount: number
  ): Promise<{ valid: boolean; reason?: string }> {
    const account = await this.prisma.virtualAccount.findUnique({
      where: { userId },
    });

    if (!account || account.availableBalance.toNumber() < amount) {
      return { valid: false, reason: '余额不足' };
    }

    return { valid: true };
  }

  private async checkRateLimit(userId: string): Promise<{ valid: boolean; reason?: string }> {
    const todayKey = `${this.RATE_LIMIT_PREFIX}${userId}:daily`;
    const todayCount = await redis.get(todayKey);
    const dailyLimit = 3;

    if (todayCount && parseInt(todayCount) >= dailyLimit) {
      return { valid: false, reason: `今日提现次数已达上限(${dailyLimit}次)` };
    }

    return { valid: true };
  }

  private checkWithdrawMethod(context: WithdrawCheckContext): { valid: boolean; reason?: string } {
    if (context.withdrawMethod === 'bank') {
      if (!context.bankInfo) {
        return { valid: false, reason: '缺少银行卡信息' };
      }
      if (!context.bankInfo.bankAccount || context.bankInfo.bankAccount.length < 10) {
        return { valid: false, reason: '银行卡号格式不正确' };
      }
      if (!context.bankInfo.bankAccountName) {
        return { valid: false, reason: '缺少开户人姓名' };
      }
    } else if (context.withdrawMethod === 'alipay') {
      if (!context.alipayInfo?.account) {
        return { valid: false, reason: '缺少支付宝账号' };
      }
    } else {
      return { valid: false, reason: '不支持的提现方式' };
    }

    return { valid: true };
  }

  private async checkUserRisk(
    userId: string
  ): Promise<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; riskFactors: string[] }> {
    const riskFactors: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { riskLevel: 'HIGH', riskFactors: ['用户不存在'] };
    }

    if (user.distributorStatus === 'SUSPENDED') {
      riskFactors.push('分销资格已被暂停');
      riskLevel = 'HIGH';
    }

    if (user.distributorStatus === 'TERMINATED') {
      riskFactors.push('分销资格已被终止');
      riskLevel = 'HIGH';
    }

    const recentFraud = await this.prisma.fraudDetection.findFirst({
      where: {
        suspectUserId: userId,
        status: { in: ['SUSPECTED', 'CONFIRMED'] },
      },
    });

    if (recentFraud) {
      riskFactors.push('存在未处理的风控记录');
      riskLevel = 'HIGH';
    }

    return { riskLevel, riskFactors };
  }

  private async checkIpDevice(
    userId: string,
    ip?: string,
    deviceId?: string
  ): Promise<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; riskFactors: string[] }> {
    const riskFactors: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (ip) {
      const recentWithdraws = await this.prisma.withdrawRequest.findMany({
        where: {
          userId: { not: userId },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        select: { userId: true },
      });

      if (recentWithdraws.length > 0) {
        riskFactors.push('同一IP地址存在其他用户提现记录');
        riskLevel = 'MEDIUM';
      }
    }

    return { riskLevel, riskFactors };
  }

  private maxRiskLevel(
    a: 'LOW' | 'MEDIUM' | 'HIGH',
    b: 'LOW' | 'MEDIUM' | 'HIGH'
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    const levels = { LOW: 0, MEDIUM: 1, HIGH: 2 };
    return levels[a] >= levels[b] ? a : b;
  }

  private async recordRiskAssessment(
    userId: string,
    assessment: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      riskFactors: string[];
      suggestedAction: 'ALLOW' | 'REVIEW' | 'REJECT';
    }
  ): Promise<void> {
    const key = `${this.RISK_PREFIX}${userId}:${Date.now()}`;
    await redis.setex(key, 86400, JSON.stringify(assessment));
  }

  async processReview(context: WithdrawReviewContext): Promise<boolean> {
    const withdraw = await this.prisma.withdrawRequest.findUnique({
      where: { id: context.withdrawId },
    });

    if (!withdraw) {
      throw new Error('提现申请不存在');
    }

    if (withdraw.status !== 'PENDING_REVIEW') {
      throw new Error('当前状态不允许审核');
    }

    if (context.reviewerRole !== 'FINANCE' && context.reviewerRole !== 'ADMIN') {
      throw new Error('无审核权限');
    }

    const newStatus: WithdrawStatus = context.approved ? 'APPROVED' : 'REJECTED';

    await this.prisma.$transaction(async (tx) => {
      await tx.withdrawRequest.update({
        where: { id: context.withdrawId },
        data: {
          status: newStatus,
          reviewerId: context.reviewerId,
          reviewTime: new Date(),
          reviewRemark: context.remark,
        },
      });

      if (!context.approved) {
        const account = await tx.virtualAccount.findUnique({
          where: { userId: withdraw.userId },
        });

        if (account) {
          const balanceBefore = account.availableBalance.toNumber();
          const balanceAfter = balanceBefore + withdraw.amount.toNumber();

          await tx.virtualAccount.update({
            where: { userId: withdraw.userId },
            data: {
              availableBalance: { increment: withdraw.amount },
            },
          });

          await tx.commissionTransaction.create({
            data: {
              transactionNo: await this.generateTransactionNo(),
              userId: withdraw.userId,
              amount: withdraw.amount.toNumber(),
              balanceBefore,
              balanceAfter,
              type: 'ADJUST',
              remark: `提现申请被驳回，金额退回: ${context.remark || '无'}`,
            },
          });
        }
      }
    });

    return true;
  }

  async processPayment(withdrawId: string): Promise<WithdrawPaymentResult> {
    const withdraw = await this.prisma.withdrawRequest.findUnique({
      where: { id: withdrawId },
    });

    if (!withdraw) {
      return { success: false, failReason: '提现申请不存在' };
    }

    if (withdraw.status !== 'APPROVED') {
      return { success: false, failReason: '当前状态不允许打款' };
    }

    const paymentNo = this.generatePaymentNo();

    await this.prisma.$transaction(async (tx) => {
      await tx.withdrawRequest.update({
        where: { id: withdrawId },
        data: {
          status: 'PAID',
          paymentNo,
          paymentTime: new Date(),
        },
      });

      const account = await tx.virtualAccount.findUnique({
        where: { userId: withdraw.userId },
      });

      if (account) {
        const balanceBefore = account.totalBalance.toNumber();
        const balanceAfter = balanceBefore - withdraw.amount.toNumber();

        await tx.virtualAccount.update({
          where: { userId: withdraw.userId },
          data: {
            totalBalance: { decrement: withdraw.amount },
            totalWithdrawn: { increment: withdraw.amount },
          },
        });

        await tx.commissionTransaction.create({
          data: {
            transactionNo: await this.generateTransactionNo(),
            userId: withdraw.userId,
            amount: -withdraw.amount.toNumber(),
            balanceBefore,
            balanceAfter,
            type: 'WITHDRAW',
            remark: `提现成功，打款单号: ${paymentNo}`,
          },
        });
      }
    });

    return {
      success: true,
      paymentNo,
      paymentTime: new Date(),
    };
  }

  private generatePaymentNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PAY${dateStr}${timestamp}${random}`;
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
}

export const cashOutEngine = new CashOutEngine();
