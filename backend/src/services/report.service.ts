import prisma from '../config/prisma';
import { OrderType, OrderStatus } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface DailyStats {
  date: string;
  purchaseCount: number;
  purchaseAmount: number;
  paymentCount: number;
  paymentAmount: number;
  redeemCount: number;
  redeemAmount: number;
  withdrawCount: number;
  withdrawAmount: number;
  failedCount: number;
  failedAmount: number;
}

export interface OverviewStats {
  totalUsers: number;
  totalAsset: number;
  totalPurchase: { count: number; amount: number };
  totalPayment: { count: number; amount: number };
  totalRedeem: { count: number; amount: number };
  totalWithdraw: { count: number; amount: number };
  todayStats: DailyStats;
}

export class ReportService {
  async getOverviewStats(): Promise<OverviewStats> {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [
      totalUsers,
      todayOrders,
      totalPurchaseOrders,
      totalPaymentOrders,
      totalRedeemOrders,
      totalWithdrawOrders,
      failedOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.findMany({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.order.findMany({
        where: { type: OrderType.PURCHASE, status: OrderStatus.SUCCESS },
      }),
      prisma.order.findMany({
        where: { type: OrderType.PAYMENT, status: OrderStatus.SUCCESS },
      }),
      prisma.order.findMany({
        where: { type: OrderType.REDEEM, status: OrderStatus.SUCCESS },
      }),
      prisma.order.findMany({
        where: { type: OrderType.WITHDRAW, status: OrderStatus.SUCCESS },
      }),
      prisma.order.findMany({
        where: { status: OrderStatus.FAILED, createdAt: { gte: todayStart, lte: todayEnd } },
      }),
    ]);

    const todayPurchaseOrders = todayOrders.filter(o => o.type === OrderType.PURCHASE && o.status === OrderStatus.SUCCESS);
    const todayPaymentOrders = todayOrders.filter(o => o.type === OrderType.PAYMENT && o.status === OrderStatus.SUCCESS);
    const todayRedeemOrders = todayOrders.filter(o => o.type === OrderType.REDEEM && o.status === OrderStatus.SUCCESS);
    const todayWithdrawOrders = todayOrders.filter(o => o.type === OrderType.WITHDRAW && o.status === OrderStatus.SUCCESS);

    const sumAmount = (orders: any[]) => orders.reduce((sum, o) => sum + Number(o.amount), 0);

    return {
      totalUsers,
      totalAsset: 0,
      totalPurchase: {
        count: totalPurchaseOrders.length,
        amount: sumAmount(totalPurchaseOrders),
      },
      totalPayment: {
        count: totalPaymentOrders.length,
        amount: sumAmount(totalPaymentOrders),
      },
      totalRedeem: {
        count: totalRedeemOrders.length,
        amount: sumAmount(totalRedeemOrders),
      },
      totalWithdraw: {
        count: totalWithdrawOrders.length,
        amount: sumAmount(totalWithdrawOrders),
      },
      todayStats: {
        date: format(todayStart, 'yyyy-MM-dd'),
        purchaseCount: todayPurchaseOrders.length,
        purchaseAmount: sumAmount(todayPurchaseOrders),
        paymentCount: todayPaymentOrders.length,
        paymentAmount: sumAmount(todayPaymentOrders),
        redeemCount: todayRedeemOrders.length,
        redeemAmount: sumAmount(todayRedeemOrders),
        withdrawCount: todayWithdrawOrders.length,
        withdrawAmount: sumAmount(todayWithdrawOrders),
        failedCount: failedOrders.length,
        failedAmount: sumAmount(failedOrders),
      },
    };
  }

  async getDailyStats(days: number = 7): Promise<DailyStats[]> {
    const stats: DailyStats[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      });

      const purchaseOrders = orders.filter(o => o.type === OrderType.PURCHASE && o.status === OrderStatus.SUCCESS);
      const paymentOrders = orders.filter(o => o.type === OrderType.PAYMENT && o.status === OrderStatus.SUCCESS);
      const redeemOrders = orders.filter(o => o.type === OrderType.REDEEM && o.status === OrderStatus.SUCCESS);
      const withdrawOrders = orders.filter(o => o.type === OrderType.WITHDRAW && o.status === OrderStatus.SUCCESS);
      const failedOrders = orders.filter(o => o.status === OrderStatus.FAILED);

      const sumAmount = (ordersList: any[]) => ordersList.reduce((sum, o) => sum + Number(o.amount), 0);

      stats.push({
        date: format(dayStart, 'yyyy-MM-dd'),
        purchaseCount: purchaseOrders.length,
        purchaseAmount: sumAmount(purchaseOrders),
        paymentCount: paymentOrders.length,
        paymentAmount: sumAmount(paymentOrders),
        redeemCount: redeemOrders.length,
        redeemAmount: sumAmount(redeemOrders),
        withdrawCount: withdrawOrders.length,
        withdrawAmount: sumAmount(withdrawOrders),
        failedCount: failedOrders.length,
        failedAmount: sumAmount(failedOrders),
      });
    }

    return stats;
  }

  async getFailedOrders(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { status: OrderStatus.FAILED },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, username: true, name: true } },
        },
      }),
      prisma.order.count({ where: { status: OrderStatus.FAILED } }),
    ]);

    return {
      orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getDPlanStats() {
    const [activePlans, failedExecutions] = await Promise.all([
      prisma.dPlan.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count({ where: { type: OrderType.DPLAN, status: OrderStatus