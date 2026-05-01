import { PrismaClient, Commission, CommissionStatus, Order, Product } from '@prisma/client';
import prisma from '../../config/prisma';
import redis from '../../config/redis';
import { config } from '../../config';

export interface CommissionTier {
  level: number;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  description: string;
}

export interface CommissionCalculationContext {
  orderId: string;
  orderAmount: number;
  productId: string;
  uplineId: string;
  upline2Id?: string;
  upline3Id?: string;
  commissionSnapshot?: {
    baseRate: number;
    levelRates?: Record<string, number>;
  };
}

export interface CommissionCalculationResult {
  success: boolean;
  commissions: {
    userId: string;
    level: number;
    frozenAmount: number;
    rate: number;
    status: CommissionStatus;
  }[];
  totalCommission: number;
  message?: string;
}

export interface SettlementContext {
  orderId: string;
  commissions: Commission[];
}

export interface SettlementResult {
  success: boolean;
  settledCommissions: {
    id: string;
    actualAmount: number;
    userId: string;
  }[];
  message?: string;
}

export class CommissionCalculatorEngine {
  private prisma: PrismaClient;
  private readonly DEFAULT_BASE_RATE = 0.10;
  private readonly DEFAULT_LEVEL_RATES: Record<number, number> = {
    1: 0.10,
    2: 0.05,
    3: 0.02,
  };

  constructor() {
    this.prisma = prisma;
  }

  async calculateFrozenCommissions(
    context: CommissionCalculationContext
  ): Promise<CommissionCalculationResult> {
    try {
      const { orderId, orderAmount, productId, uplineId, upline2Id, upline3Id, commissionSnapshot } = context;

      const levelRates = this.getLevelRates(commissionSnapshot);

      const commissions: CommissionCalculationResult['commissions'] = [];
      let totalCommission = 0;

      if (uplineId) {
        const level1Amount = Math.floor(orderAmount * levelRates[1]);
        commissions.push({
          userId: uplineId,
          level: 1,
          frozenAmount: level1Amount,
          rate: levelRates[1],
          status: 'FROZEN',
        });
        totalCommission += level1Amount;
      }

      if (upline2Id && levelRates[2] && levelRates[2] > 0) {
        const level2Amount = Math.floor(orderAmount * levelRates[2]);
        commissions.push({
          userId: upline2Id,
          level: 2,
          frozenAmount: level2Amount,
          rate: levelRates[2],
          status: 'FROZEN',
        });
        totalCommission += level2Amount;
      }

      if (upline3Id && levelRates[3] && levelRates[3] > 0) {
        const level3Amount = Math.floor(orderAmount * levelRates[3]);
        commissions.push({
          userId: upline3Id,
          level: 3,
          frozenAmount: level3Amount,
          rate: levelRates[3],
          status: 'FROZEN',
        });
        totalCommission += level3Amount;
      }

      await this.createFrozenCommissions({
        orderId,
        orderAmount,
        productId,
        commissions,
        levelRates,
      });

      return {
        success: true,
        commissions,
        totalCommission,
      };
    } catch (error) {
      console.error('分润计算错误:', error);
      return {
        success: false,
        commissions: [],
        totalCommission: 0,
        message: error instanceof Error ? error.message : '分润计算失败',
      };
    }
  }

  private getLevelRates(
    snapshot?: CommissionCalculationContext['commissionSnapshot']
  ): Record<number, number> {
    if (snapshot?.levelRates) {
      const rates: Record<number, number> = {};
      for (const [level, rate] of Object.entries(snapshot.levelRates)) {
        rates[parseInt(level)] = rate;
      }
      return rates;
    }

    if (snapshot?.baseRate) {
      return {
        1: snapshot.baseRate,
        2: snapshot.baseRate * 0.5,
        3: snapshot.baseRate * 0.2,
      };
    }

    return this.DEFAULT_LEVEL_RATES;
  }

  private async createFrozenCommissions(params: {
    orderId: string;
    orderAmount: number;
    productId: string;
    commissions: CommissionCalculationResult['commissions'];
    levelRates: Record<number, number>;
  }): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const settlementDueAt = new Date();
    settlementDueAt.setDate(settlementDueAt.getDate() + config.AFTER_SALE_DAYS);

    for (const comm of params.commissions) {
      const commissionNo = await this.generateCommissionNo();

      await this.prisma.$transaction(async (tx) => {
        const commission = await tx.commission.create({
          data: {
            commissionNo,
            orderId: params.orderId,
            userId: comm.userId,
            orderAmount: params.orderAmount,
            frozenAmount: comm.frozenAmount,
            distributionLevel: comm.level,
            commissionRate: comm.rate,
            status: 'FROZEN',
            settlementDueAt,
          },
        });

        const virtualAccount = await tx.virtualAccount.upsert({
          where: { userId: comm.userId },
          update: {
            frozenBalance: { increment: comm.frozenAmount },
            totalBalance: { increment: comm.frozenAmount },
          },
          create: {
            userId: comm.userId,
            frozenBalance: comm.frozenAmount,
            totalBalance: comm.frozenAmount,
            availableBalance: 0,
          },
        });

        await tx.commissionTransaction.create({
          data: {
            transactionNo: await this.generateTransactionNo(),
            userId: comm.userId,
            commissionId: commission.id,
            amount: comm.frozenAmount,
            balanceBefore: virtualAccount.totalBalance.minus(comm.frozenAmount).toNumber(),
            balanceAfter: virtualAccount.totalBalance.toNumber(),
            type: 'FROZEN',
            orderId: params.orderId,
            orderNo: order.orderNo,
            remark: `订单${order.orderNo}佣金冻结`,
          },
        });
      });
    }
  }

  async settleCommissions(context: SettlementContext): Promise<SettlementResult> {
    try {
      const { orderId, commissions } = context;

      const settledCommissions: SettlementResult['settledCommissions'] = [];

      for (const commission of commissions) {
        if (commission.status !== 'FROZEN' && commission.status !== 'PENDING_SETTLEMENT') {
          continue;
        }

        const actualAmount = await this.calculateActualAmount(commission);

        await this.prisma.$transaction(async (tx) => {
          await tx.commission.update({
            where: { id: commission.id },
            data: {
              status: 'SETTLED',
              actualAmount,
              settledAt: new Date(),
            },
          });

          const virtualAccount = await tx.virtualAccount.findUnique({
            where: { userId: commission.userId },
          });

          if (!virtualAccount) {
            throw new Error(`用户${commission.userId}账户不存在`);
          }

          const balanceBefore = virtualAccount.availableBalance.toNumber();
          const balanceAfter = balanceBefore + actualAmount;

          await tx.virtualAccount.update({
            where: { userId: commission.userId },
            data: {
              frozenBalance: { decrement: commission.frozenAmount },
              availableBalance: { increment: actualAmount },
              totalEarnings: { increment: actualAmount },
            },
          });

          await tx.commissionTransaction.create({
            data: {
              transactionNo: await this.generateTransactionNo(),
              userId: commission.userId,
              commissionId: commission.id,
              amount: actualAmount,
              balanceBefore,
              balanceAfter,
              type: 'SETTLE',
              orderId: commission.orderId,
              remark: `佣金结算，实际发放${actualAmount}分`,
            },
          });
        });

        settledCommissions.push({
          id: commission.id,
          actualAmount,
          userId: commission.userId,
        });
      }

      return {
        success: true,
        settledCommissions,
      };
    } catch (error) {
      console.error('结算处理错误:', error);
      return {
        success: false,
        settledCommissions: [],
        message: error instanceof Error ? error.message : '结算处理失败',
      };
    }
  }

  private async calculateActualAmount(commission: Commission): Promise<number> {
    return commission.frozenAmount;
  }

  async cancelCommissionsByOrder(orderId: string, reason: string): Promise<boolean> {
    try {
      const commissions = await this.prisma.commission.findMany({
        where: {
          orderId,
          status: { in: ['FROZEN', 'PENDING_SETTLEMENT'] },
        },
      });

      for (const commission of commissions) {
        await this.prisma.$transaction(async (tx) => {
          await tx.commission.update({
            where: { id: commission.id },
            data: {
              status: 'CANCELLED',
              cancelReason: reason,
              cancelledAt: new Date(),
            },
          });

          const virtualAccount = await tx.virtualAccount.findUnique({
            where: { userId: commission.userId },
          });

          if (virtualAccount) {
            const balanceBefore = virtualAccount.totalBalance.toNumber();
            const balanceAfter = balanceBefore - commission.frozenAmount.toNumber();

            await tx.virtualAccount.update({
              where: { userId: commission.userId },
              data: {
                frozenBalance: { decrement: commission.frozenAmount },
                totalBalance: { decrement: commission.frozenAmount },
              },
            });

            await tx.commissionTransaction.create({
              data: {
                transactionNo: await this.generateTransactionNo(),
                userId: commission.userId,
                commissionId: commission.id,
                amount: -commission.frozenAmount.toNumber(),
                balanceBefore,
                balanceAfter,
                type: 'CANCEL',
                orderId: commission.orderId,
                remark: `佣金取消: ${reason}`,
              },
            });
          }
        });
      }

      return true;
    } catch (error) {
      console.error('取消佣金错误:', error);
      return false;
    }
  }

  private async generateCommissionNo(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `CM${dateStr}${timestamp}${random}`;
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

  getDefaultLevelRates(): Record<number, number> {
    return { ...this.DEFAULT_LEVEL_RATES };
  }
}

export const commissionCalculatorEngine = new CommissionCalculatorEngine();
