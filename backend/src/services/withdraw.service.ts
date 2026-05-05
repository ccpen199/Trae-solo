import prisma from '../config/prisma';
import { generateOrderNo } from '../utils/order';
import transactionService from './transaction.service';
import redeemService from './redeem.service';
import { fundNotificationQueue } from '../config/queue';
import { OrderType, OrderStatus, TransactionType, TransactionStatus, TransactionChannel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import dotenv from 'dotenv';

dotenv.config();

const FUND_NAV = parseFloat(process.env.FUND_NAV || '1.0');

export interface WithdrawInput {
  userId: string;
  amount: number;
  bankCardId: string;
}

export interface NormalWithdrawInput extends WithdrawInput {
  source: 'BALANCE' | 'FUND';
}

export class WithdrawService {
  async normalWithdraw(input: NormalWithdrawInput) {
    if (input.amount <= 0) {
      throw new Error('提现金额必须大于0');
    }

    if (input.source === 'FUND') {
      await redeemService.instantRedeem({
        userId: input.userId,
        amount: input.amount,
      });
    }

    const orderNo = generateOrderNo('WTH');

    const result = await prisma.$transaction(async (tx) => {
      const accountBalance = await tx.accountBalance.findUnique({
        where: { userId: input.userId },
      });

      if (!accountBalance) {
        throw new Error('用户账户信息不存在');
      }

      if (accountBalance.available.lessThan(input.amount)) {
        throw new Error('账户余额不足');
      }

      await tx.accountBalance.update({
        where: { userId: input.userId },
        data: {
          available: { decrement: input.amount },
        },
      });

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          orderNo,
          type: OrderType.WITHDRAW,
          amount: input.amount,
          status: OrderStatus.PROCESSING,
        },
      });

      await transactionService.create(
        {
          userId: input.userId,
          orderNo,
          type: TransactionType.WITHDRAW,
          channel: TransactionChannel.ACCOUNT_BALANCE,
          amount: input.amount,
          description: `普通提现 ${input.amount} 元到银行卡`,
        },
        TransactionStatus.PROCESSING
      );

      return order;
    });

    return {
      orderNo: result.orderNo,
      amount: Number(result.amount),
      status: result.status,
      message: '普通提现已提交，资金将在1-3个工作日内到账',
    };
  }

  async normalRedeemWithdraw(input: WithdrawInput) {
    if (input.amount <= 0) {
      throw new Error('提现金额必须大于0');
    }

    const orderNo = generateOrderNo('NRW');
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
          type: OrderType.WITHDRAW,
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
          description: `正常赎回提现 ${input.amount} 元（享受当日收益）`,
        },
        TransactionStatus.PROCESSING
      );

      return order;
    });

    await fundNotificationQueue.add({
      type: 'NORMAL_REDEEM_WITHDRAW',
      userId: input.userId,
      orderNo,
      shares: Number(shares),
      nav: FUND_NAV,
      amount: input.amount,
      bankCardId: input.bankCardId,
    });

    return {
      orderNo: result.orderNo,
      amount: Number(result.amount),
      shares: Number(result.shares),
      nav: Number(result.nav),
      status: result.status,
      message: '正常赎回提现已提交，资金将在T+1日到账，可享受当日收益',
    };
  }
}

export default new WithdrawService();
