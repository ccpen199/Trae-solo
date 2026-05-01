import { PrismaClient, CommissionStatus, UserRole } from '@prisma/client';
import prisma from '../config/prisma';
import { commissionCalculatorEngine } from '../engines/commission-calculator';
import { config } from '../config';

export interface CommissionStats {
  totalEarnings: number;
  totalWithdrawn: number;
  availableBalance: number;
  frozenBalance: number;
  pendingSettlement: number;
}

export interface CommissionQuery {
  userId: string;
  status?: CommissionStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export class CommissionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async getCommissionStats(userId: string): Promise<CommissionStats> {
    const account = await this.prisma.virtualAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return {
        totalEarnings: 0,
        totalWithdrawn: 0,
        availableBalance: 0,
        frozenBalance: 0,
        pendingSettlement: 0,
      };
    }

    const pendingSettlementCommissions = await this.prisma.commission.findMany({
      where: {
        userId,
        status: { in: ['FROZEN', 'PENDING_SETTLEMENT'] },
      },
      select: { frozenAmount: true },
    });

    const pendingSettlement = pendingSettlementCommissions.reduce(
      (sum, c) => sum + c.frozenAmount.toNumber(),
      0
    );

    return {
      totalEarnings: account.totalEarnings.toNumber(),
      totalWithdrawn: account.totalWithdrawn.toNumber(),
      availableBalance: account.availableBalance.toNumber(),
      frozenBalance: account.frozenBalance.toNumber(),
      pendingSettlement,
    };
  }

  async getCommissions(query: CommissionQuery) {
    const { userId, status, startDate, endDate, page = 1, pageSize = 20 } = query;

    const where: {
      userId: string;
      status?: CommissionStatus;
      frozenAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = { userId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.frozenAt = {};
      if (startDate) {
        where.frozenAt.gte = startDate;
      }
      if (endDate) {
        where.frozenAt.lte = endDate;
      }
    }

    const [total, commissions] = await Promise.all([
      this.prisma.commission.count({ where }),
      this.prisma.commission.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { frozenAt: 'desc' },
        include: {
          order: {
            select: {
              orderNo: true,
              status: true,
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: commissions,
    };
  }

  async getTransactions(query: {
    userId: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { userId, type, startDate, endDate, page = 1, pageSize = 20 } = query;

    const where: {
      userId: string;
      type?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = { userId };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [total, transactions] = await Promise.all([
      this.prisma.commissionTransaction.count({ where }),
      this.prisma.commissionTransaction.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: transactions,
    };
  }

  async getPerformanceStats(userId: string, period: 'day' | 'week' | 'month' | 'total') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(0);
    }

    const [orderCount, settledCommissions, downlineCount] = await Promise.all([
      this.prisma.orderAttribution.count({
        where: {
          uplineId: userId,
          order: {
            createdAt: { gte: startDate },
            status: { notIn: ['CANCELLED', 'REFUNDED'] },
          },
        },
      }),
      this.prisma.commission.findMany({
        where: {
          userId,
          status: 'SETTLED',
          settledAt: { gte: startDate },
        },
        select: { actualAmount: true },
      }),
      this.prisma.distributionRelation.count({
        where: {
          parentId: userId,
          status: 'ACTIVE',
          joinTime: { gte: startDate },
        },
      }),
    ]);

    const totalEarnings = settledCommissions.reduce(
      (sum, c) => sum + (c.actualAmount?.toNumber() || 0),
      0
    );

    return {
      period,
      orderCount,
      totalEarnings,
      downlineCount,
      avgOrderValue: orderCount > 0 ? totalEarnings / orderCount : 0,
    };
  }

  async getSettlementReport(query: {
    startDate: Date;
    endDate: Date;
    userId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { startDate, endDate, userId, page = 1, pageSize = 50 } = query;

    const where: {
      status: CommissionStatus;
      settledAt: {
        gte: Date;
        lte: Date;
      };
      userId?: string;
    } = {
      status: 'SETTLED',
      settledAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    const [total, commissions] = await Promise.all([
      this.prisma.commission.count({ where }),
      this.prisma.commission.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { settledAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              nickname: true,
              referralCode: true,
            },
          },
          order: {
            select: {
              orderNo: true,
              userId: true,
              payTime: true,
            },
          },
        },
      }),
    ]);

    const summary = await this.prisma.commission.aggregate({
      where,
      _sum: {
        actualAmount: true,
        frozenAmount: true,
      },
      _count: true,
    });

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        totalAmount: summary._sum.actualAmount?.toNumber() || 0,
        totalCount: summary._count,
      },
      data: commissions,
    };
  }
}

export const commissionService = new CommissionService();
