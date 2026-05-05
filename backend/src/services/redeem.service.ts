import prisma from '../config/prisma';
import { generateOrderNo } from '../utils/order';
import transactionService from './transaction.service';
import { fundNotificationQueue } from '../config/queue';
import { OrderType, OrderStatus, TransactionType, TransactionStatus, TransactionChannel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { startOfDay, startOfMonth } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const FUND_NAV = parseFloat(process.env.FUND_NAV || '1.0');
const MAX_SINGLE_REDEEM = parseFloat(process.env.MAX_SINGLE_REDEEM || '50000');
const MAX_DAILY_REDEEM = parseFloat(process.env.MAX_DAILY_REDEEM || '100000');
const MAX_MONTHLY_REDEEM = parseFloat(process.env.MAX_MONTHLY_REDEEM || '500000');

export interface RedeemLimitInfo {
  maxRedeemAmount: number;
  maxSingleRedeem: number;
  maxDailyRedeem: number;
  maxMonthlyRedeem: number;
  todayUsed: number;
  monthUsed: number;
}

export interface InstantRedeemInput {
  userId: string;
  amount: number;
}

export class RedeemService {
  async getRedeemLimitInfo(userId: string): Promise<RedeemLimitInfo> {
    const fundShare = await prisma.fundShare.findUnique({
      where: { userId },
    });

    if (!fundShare) {
      throw new Error('用户基金份额信息不存在');
    }

    const nav = Number(fundShare.nav);
    const maxRedeemAmount = Number(fundShare.availableShares) * nav;

    const todayStart = startOfDay(new Date());
    const monthStart = startOfMonth(new Date());

    const [todayTransactions, monthTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: { in: [TransactionType.REDEEM, TransactionType.PAYMENT] },
          channel: TransactionChannel.FUND_SHARE,
          status: TransactionStatus.SUCCESS,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: { in: [TransactionType.REDEEM, TransactionType.PAYMENT] },
          channel: TransactionChannel.FUND_SHARE,
          status: TransactionStatus.SUCCESS,
          createdAt: { gte: monthStart },
        },
      }),
    ]);

    const todayUsed = todayTransactions.reduce((sum, t) => sum.add(t.amount), new Decimal(0));
    const monthUsed = monthTransactions.reduce((sum, t) => sum.add(t.amount), new Decimal(0));

    return {
      maxRedeemAmount,
      maxSingleRedeem: MAX_SINGLE_REDEEM,
      maxDailyRedeem: MAX_DAILY_REDEEM,
      maxMonthlyRedeem: MAX_MONTHLY_REDEEM,
      todayUsed: Number(todayUsed),
      monthUsed: Number(monthUsed),
    };
  }

  async instantRedeem(input: InstantRedeemInput) {
    if (input.amount <= 0) {
      throw new Error('赎回金额必须大于0');
    }

    const limitInfo = await this.getRedeemLimitInfo(input.userId);

    if (input.amount > limitInfo.maxRedeemAmount) {
      throw new Error('赎回金额超过可用金额');
    }

    if (input.amount > limitInfo.maxSingleRedeem) {
      throw new Error(`单笔赎回金额不能超过 ${limitInfo.maxSingleRedeem} 元`);
    }

    if (input.amount + limitInfo.todayUsed > limitInfo.maxDailyRedeem) {
      const remaining = limitInfo.maxDailyRedeem - limitInfo.todayUsed;
      throw new Error(`今日剩余可赎回额度为 ${remaining} 元`);
    }

    if (input.amount + limitInfo.monthUsed > limitInfo.maxMonthlyRedeem) {
      const remaining = limitInfo.maxMonthlyRedeem - limitInfo.monthUsed;
      throw new Error(`本月剩余可赎回额度为 ${remaining} 元`);
    }

    const orderNo = generateOrderNo('RED');
    const nav = new Decimal(FUND_NAV);
    const shares = new Decimal(input.amount).div(nav);

    const result = await prisma.$transaction(async (tx) => {
      const fundShare = await tx.fundShare.findUnique({
        where: { userId: input.userId },
      });

      if (!fundShare) {
        throw new Error('用户基金份额信息不存在');
      }

      const availableAmount = fundShare.availableShares.mul(fundShare.nav);
      if (availableAmount.lessThan(input.amount)) {
        throw new Error('基金份额不足');
      }

      await tx.fundShare.update({
        where: { userId: input.userId },
        data: {
          totalShares: { decrement: shares },
          availableShares: { decrement: shares },
        },
      });

      await tx.accountBalance.update({
        where: { userId: input.userId },
        data: {
          available: { increment: input.amount },
        },
      });

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          orderNo,
          type: OrderType.REDEEM,
          amount: input.amount,
          shares,
          nav,
          status: OrderStatus.SUCCESS,
        },
      });

      await transactionService.create(
        {
          userId: input.userId,
          orderNo,
          type: TransactionType.REDEEM,
          channel: TransactionChannel.FUND_SHARE,
          amount: input.amount,
          shares,
          nav,
          description: `实时赎回 ${input.amount} 元到账户余额`,
        },
        TransactionStatus.SUCCESS
      );

      return order;
    });

    await fundNotificationQueue.add({
      type: 'REDEEM',
      userId: input.userId,
      orderNo,
      shares: Number(shares),
      nav: FUND_NAV,
      amount: input.amount,
    });

    return {
      orderNo: result.orderNo,
      amount: Number(result.amount),
      shares: Number(result.shares),
      nav: Number(result.nav),
      status: result.status,
    };
  }

  async normalRedeem(input: InstantRedeemInput) {
    if (input.amount <= 0) {
      throw new Error('赎回金额必须大于0');
    }

    const orderNo = generateOrderNo('NRD');
    const nav = new Decimal(FUND_NAV);
    const shares = new Decimal(input.amount).div(nav);

    const result = await prisma.$transaction(async (tx) => {
      const fundShare = await tx.fundShare.findUnique({
        where: { userId: input.userId },
      });

      if (!fundShare) {
        throw new Error('用户基金份额信息不存在');
      }

      const availableAmount = fundShare.availableShares.mul(fundShare.nav);
      if (availableAmount.lessThan(input.amount)) {
        throw new Error('基金份额不足');
      }

      await tx.fundShare.update({
        where: { userId: input.userId },
        data: {
          availableShares: { decrement: shares },
          frozenShares: { increment: shares },
        },
      });

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          orderNo,
          type: OrderType.REDEEM,
          amount: input.amount,
          shares,
          nav,
          status: OrderStatus.PROCESSING,
        },
      });

      await transactionService.create(
        {
          userId: input.userId,
          orderNo,
          type: TransactionType.REDEEM,
          channel: TransactionChannel.FUND_SHARE,
          amount: input.amount,
          shares,
          nav,
          description: `正常赎回处理中 - ${input.amount} 元`,
        },
        TransactionStatus.PROCESSING
      );

      return order;
    });

    await fundNotificationQueue.add({
      type: 'NORMAL_REDEEM',
      userId: input.userId,
      orderNo,
      shares: Number(shares),
      nav: FUND_NAV,
      amount: input.amount,
    });

    return {
      orderNo: result.orderNo,
      amount: Number(result.amount),
      shares: Number(result.shares),
      nav: Number(result.nav),
      status: result.status,
      message: '正常赎回已提交，资金将在T+1日到账，可享受当日收益',
    };
  }
}

export default new RedeemService();
