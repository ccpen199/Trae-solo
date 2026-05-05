import prisma from '../config/prisma';
import { TransactionType, TransactionStatus, TransactionChannel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateTransactionInput {
  userId: string;
  orderNo?: string;
  type: TransactionType;
  channel?: TransactionChannel;
  amount: Decimal | number;
  shares?: Decimal | number;
  nav?: Decimal | number;
  description?: string;
  externalOrderNo?: string;
}

export class TransactionService {
  async create(input: CreateTransactionInput, status: TransactionStatus = TransactionStatus.PENDING) {
    const amount = typeof input.amount === 'number' ? new Decimal(input.amount) : input.amount;
    const shares = input.shares ? (typeof input.shares === 'number' ? new Decimal(input.shares) : input.shares) : undefined;
    const nav = input.nav ? (typeof input.nav === 'number' ? new Decimal(input.nav) : input.nav) : undefined;

    return prisma.transaction.create({
      data: {
        userId: input.userId,
        orderNo: input.orderNo,
        type: input.type,
        channel: input.channel,
        amount,
        shares,
        nav,
        status,
        description: input.description,
        externalOrderNo: input.externalOrderNo,
      },
    });
  }

  async updateStatus(transactionId: string, status: TransactionStatus, failReason?: string) {
    return prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        failReason,
      },
    });
  }

  async getByOrderNo(orderNo: string) {
    return prisma.transaction.findUnique({
      where: { orderNo },
    });
  }

  async getByUserId(userId: string, page: number = 1, pageSize: number = 20, types?: TransactionType[]) {
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (types && types.length > 0) {
      where.type = { in: types };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTransferInList(userId: string, page: number = 1, pageSize: number = 20) {
    return this.getByUserId(userId, page, pageSize, [TransactionType.PURCHASE, TransactionType.TRANSFER_IN]);
  }

  async getTransferOutList(userId: string, page: number = 1, pageSize: number = 20) {
    return this.getByUserId(userId, page, pageSize, [TransactionType.REDEEM, TransactionType.TRANSFER_OUT, TransactionType.WITHDRAW, TransactionType.PAYMENT]);
  }
}

export default new TransactionService();
