import prisma from '../config/prisma';
import { generateOrderNo } from '../utils/order';
import transactionService from './transaction.service';
import { fundNotificationQueue } from '../config/queue';
import { OrderType, OrderStatus, TransactionType, TransactionStatus, TransactionChannel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import dotenv from 'dotenv';

dotenv.config();

const FUND_NAV = parseFloat(process.env.FUND_NAV || '1.0');

export interface PaymentInfo {
  orderAmount: number;
  accountBalance: {
    available: number;
  };
  fundShare: {
    availableAmount: number;
    availableShares: number;
    nav: number;
  };
  maxUsableAmount: number;
}

export interface PaymentInput {
  userId: string;
  orderAmount: number;
  useFundShare: boolean;
  useAccountBalance: boolean;
  paymentPassword: string;
}

export class PaymentService {
  async getPaymentInfo(userId: string, orderAmount: number): Promise<PaymentInfo> {
    const [accountBalance, fundShare] = await Promise.all([
      prisma.accountBalance.findUnique({
        where: { userId },
      }),
      prisma.fundShare.findUnique({
        where: { userId },
      }),
    ]);

    if (!accountBalance || !fundShare) {
      throw new Error('用户资产信息不存在');
    }

    const nav = Number(fundShare.nav);
    const fundAvailableAmount = Number(fundShare.availableShares) * nav;

    let maxUsableAmount = Number(accountBalance.available);
    if (fundAvailableAmount > 0) {
      maxUsableAmount = Number(accountBalance.available) + fundAvailableAmount;
    }

    return {
      orderAmount,
      accountBalance: {
        available: Number(accountBalance.available),
      },
      fundShare: {
        availableAmount: fundAvailableAmount,
        availableShares: Number(fundShare.availableShares),
        nav,
      },
      maxUsableAmount,
    };
  }

  async executePayment(input: PaymentInput) {
    if (input.orderAmount <= 0) {
      throw new Error('订单金额必须大于0');
    }

    const orderNo = generateOrderNo('PAY');
    const nav = new Decimal(FUND_NAV);

    let remainingAmount = new Decimal(input.orderAmount);
    let fundSharesToDeduct = new Decimal(0);
    let balanceToDeduct = new Decimal(0);

    const result = await prisma.$transaction(async (tx) => {
      const [accountBalance, fundShare] = await Promise.all([
        tx.accountBalance.findUnique({ where: { userId: input.userId } }),
        tx.fundShare.findUnique({ where: { userId: input.userId } }),
      ]);

      if (!accountBalance || !fundShare) {
        throw new Error('用户资产信息不存在');
      }

      let totalAvailable = new Decimal(0);
      if (input.useAccountBalance) {
        totalAvailable = totalAvailable.add(accountBalance.available);
      }
      if (input.useFundShare) {
        const fundAvailableAmount = fundShare.availableShares.mul(nav);
        totalAvailable = totalAvailable.add(fundAvailableAmount);
      }

      if (totalAvailable.lessThan(input.orderAmount)) {
        throw new Error('余额不足，无法完成支付');
      }

      if (input.useFundShare) {
        const fundAvailableAmount = fundShare.availableShares.mul(nav);
        if (fundAvailableAmount.greaterThan(0)) {
          if (fundAvailableAmount.greaterThanOrEqualTo(remainingAmount)) {
            fundSharesToDeduct = remainingAmount.div(nav);
            remainingAmount = new Decimal(0);
          } else {
            fundSharesToDeduct = fundShare.availableShares;
            remainingAmount = remainingAmount.sub(fundAvailableAmount);
          }
        }
      }

      if (remainingAmount.greaterThan(0) && input.useAccountBalance) {
        if (accountBalance.available.lessThan(remainingAmount)) {
          throw new Error('余额不足，无法完成支付');
        }
        balanceToDeduct = remainingAmount;
        remainingAmount = new Decimal(0);
      }

      if (remainingAmount.greaterThan(0)) {
        throw new Error('余额不足，无法完成支付');
      }

      if (fundSharesToDeduct.greaterThan(0)) {
        await tx.fundShare.update({
          where: { userId: input.userId },
          data: {
            totalShares: { decrement: fundSharesToDeduct },
            availableShares: { decrement: fundSharesToDeduct },
          },
        });
      }

      if (balanceToDeduct.greaterThan(0)) {
        await tx.accountBalance.update({
          where: { userId: input.userId },
          data: {
            available: { decrement: balanceToDeduct },
          },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: input.userId,
          orderNo,
          type: OrderType.PAYMENT,
          amount: input.orderAmount,
          shares: fundSharesToDeduct.greaterThan(0) ? fundSharesToDeduct : undefined,
          nav: fundSharesToDeduct.greaterThan(0) ? nav : undefined,
          status: OrderStatus.SUCCESS,
        },
      });

      if (fundSharesToDeduct.greaterThan(0)) {
        await transactionService.create(
          {
            userId: input.userId,
            orderNo,
            type: TransactionType.PAYMENT,
            channel: TransactionChannel.FUND_SHARE,
            amount: fundSharesToDeduct.mul(nav),
            shares: fundSharesToDeduct,
            nav,
            description: `货币基金支付 - 订单 ${orderNo}`,
          },
          TransactionStatus.SUCCESS
        );
      }

      if (balanceToDeduct.greaterThan(0)) {
        await transactionService.create(
          {
            userId: input.userId,
            orderNo,
            type: TransactionType.PAYMENT,
            channel: TransactionChannel.ACCOUNT_BALANCE,
            amount: balanceToDeduct,
            description: `账户余额支付 - 订单 ${orderNo}`,
          },
          TransactionStatus.SUCCESS
        );
      }

      return order;
    });

    if (fundSharesToDeduct.greaterThan(0)) {
      await fundNotificationQueue.add({
        type: 'PAYMENT',
        userId: input.userId,
        orderNo,
        shares: Number(fundSharesToDeduct),
        nav: FUND_NAV,
        amount: fundSharesToDeduct.toNumber() * FUND_NAV,
      });
    }

    return {
      orderNo: result.orderNo,
      amount: Number(result.amount),
      status: result.status,
      fundSharesUsed: Number(fundSharesToDeduct),
      balanceUsed: Number(balanceToDeduct),
    };
  }

  async refund(userId: string, originalOrderNo: string, refundAmount: number) {
    if (refundAmount <= 0) {
      throw new Error('退款金额必须大于0');
    }

    const originalOrder = await prisma.order.findUnique({
      where: { orderNo: originalOrderNo },
    });

    if (!originalOrder || originalOrder.userId !== userId) {
      throw new Error('订单不存在');
    }

    if (originalOrder.type !== OrderType.PAYMENT) {
      throw new Error('只能对支付订单进行退款');
    }

    if (originalOrder.status !== OrderStatus.SUCCESS) {
      throw new Error('订单状态不支持退款');
    }

    const refundOrderNo = generateOrderNo('RFN');

    const result = await prisma.$transaction(async (tx) => {
      await tx.accountBalance.update({
        where: { userId },
        data: {
          available: { increment: refundAmount },
        },
      });

      const refundOrder = await tx.order.create({
        data: {
          userId,
          orderNo: refundOrderNo,
          type: OrderType.PURCHASE,
          amount: refundAmount,
          status: OrderStatus.SUCCESS,
          externalOrderNo: originalOrderNo,
        },
      });

      await transactionService.create(
        {
          userId,
          orderNo: refundOrderNo,
          type: TransactionType.REFUND,
          channel: TransactionChannel.ACCOUNT_BALANCE,
          amount: refundAmount,
          description: `退款到账户余额 - 原订单 ${originalOrderNo}`,
          externalOrderNo: originalOrderNo,
        },
        TransactionStatus.SUCCESS
      );

      return refundOrder;
    });

    return {
      orderNo: result.orderNo,
      originalOrderNo,
      refundAmount,
      status: result.status,
    };
  }
}

export default new PaymentService();
