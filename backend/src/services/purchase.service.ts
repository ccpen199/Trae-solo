import prisma from '../config/prisma';
import { generateOrderNo } from '../utils/order';
import transactionService from './transaction.service';
import { OrderType, OrderStatus, TransactionType, TransactionStatus, TransactionChannel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import dotenv from 'dotenv';

dotenv.config();

const FUND_NAV = parseFloat(process.env.FUND_NAV || '1.0');

export interface PurchaseInput {
  userId: string;
  amount: number;
  fromAccount: 'BALANCE' | 'BANK_CARD';
}

export class PurchaseService {
  async purchase(input: PurchaseInput) {
    if (input.amount <= 0) {
      throw new Error('购买金额必须大于0');
    }

    const orderNo = generateOrderNo('PUR');
    const nav = new Decimal(FUND_NAV);
    const shares = new Decimal(input.amount).div(nav);

    const result = await prisma.$transaction(async (tx) => {
      if (input.fromAccount === 'BALANCE') {
        const accountBalance = await tx.accountBalance.findUnique({
          where: { userId: input.userId },
        });

        if (!accountBalance || accountBalance.available.lessThan(input.amount)) {
          throw new Error('账户余额不足');
        }

        await tx.accountBalance.update({
          where: { userId: input.userId },
          data: {
            available: { decrement: input.amount },
          },
        });
      }

      const fundShare = await tx.fundShare.findUnique({
        where: { userId: input.userId },
      });

      if (!fundShare) {
        throw new Error('用户基金份额信息不存在');
      }

      await tx.fundShare.update({
        where: { userId: input.userId },
        data: {
          totalShares: { increment: shares },
          availableShares: { increment: shares },
        },
      });

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          orderNo,
          type: OrderType.PURCHASE,
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
          type: TransactionType.PURCHASE,
          channel: input.fromAccount === 'BALANCE' ? TransactionChannel.ACCOUNT_BALANCE : undefined,
          amount: input.amount,
          shares,
          nav,
          description: `购买货币基金 ${input.amount} 元`,
        },
        TransactionStatus.SUCCESS
      );

      return order;
    });

    return {
      orderNo: result.orderNo,
      amount: Number(result.amount),
      shares: Number(result.shares),
      nav: Number(result.nav),
      status: result.status,
    };
  }
}

export default new PurchaseService();
