import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Member } from '../../members/entities/member.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Table } from '../../tables/entities/table.entity';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus, TableStatus } from '../../common/types';
import dayjs from 'dayjs';

export interface DailyReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderCounts: {
    dineIn: number;
    takeaway: number;
    delivery: number;
  };
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  paymentBreakdown: Array<{
    method: PaymentMethod;
    amount: number;
    count: number;
    percentage: number;
  }>;
  hourlyData: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
}

export interface MenuReport {
  topSelling: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
    categoryId: string;
  }>;
  categorySummary: Array<{
    category: string;
    categoryId: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface TableReport {
  totalTables: number;
  statusBreakdown: {
    vacant: number;
    occupied: number;
    cleaning: number;
    reserved: number;
  };
  tableTurnover: Array<{
    tableNumber: string;
    orderCount: number;
    totalRevenue: number;
  }>;
}

export interface MemberReport {
  totalMembers: number;
  newMembers: number;
  activeMembers: number;
  levelBreakdown: Array<{
    level: string;
    count: number;
  }>;
  memberRevenue: number;
  averageSpend: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
  ) {}

  async getDailyReport(date: string): Promise<DailyReport> {
    const startDate = dayjs(date).startOf('day').toDate();
    const endDate = dayjs(date).endOf('day').toDate();

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: OrderStatus.COMPLETED,
      },
      relations: ['items'],
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.paidAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const orderCounts = {
      dineIn: orders.filter((o) => o.orderType === OrderType.DINE_IN).length,
      takeaway: orders.filter((o) => o.orderType === OrderType.TAKEAWAY).length,
      delivery: orders.filter((o) => o.orderType === OrderType.DELIVERY).length,
    };

    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const order of orders) {
      if (order.items) {
        for (const item of order.items) {
          if (
            item.status !== 'cancelled' &&
            item.status !== 'refunded'
          ) {
            const existing = itemMap.get(item.name) || {
              name: item.name,
              quantity: 0,
              revenue: 0,
            };
            existing.quantity += item.quantity;
            existing.revenue += item.subtotal;
            itemMap.set(item.name, existing);
          }
        }
      }
    }

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      date,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      orderCounts,
      topItems,
    };
  }

  async getRevenueReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<RevenueReport> {
    const startDate = dayjs(dateFrom).startOf('day').toDate();
    const endDate = dayjs(dateTo).endOf('day').toDate();

    const payments = await this.paymentRepository.find({
      where: {
        paidAt: Between(startDate, endDate),
        status: PaymentStatus.PAID,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const paymentMethodMap = new Map<
      PaymentMethod,
      { amount: number; count: number }
    >();

    for (const payment of payments) {
      const existing = paymentMethodMap.get(payment.method) || {
        amount: 0,
        count: 0,
      };
      existing.amount += payment.amount;
      existing.count += 1;
      paymentMethodMap.set(payment.method, existing);
    }

    const paymentBreakdown = Array.from(paymentMethodMap.entries()).map(
      ([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0,
      }),
    );

    const hourlyMap = new Map<number, { orders: number; revenue: number }>();

    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { orders: 0, revenue: 0 });
    }

    for (const payment of payments) {
      if (payment.paidAt) {
        const hour = payment.paidAt.getHours();
        const existing = hourlyMap.get(hour);
        existing.orders += 1;
        existing.revenue += payment.amount;
      }
    }

    const hourlyData = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({
        hour,
        orders: data.orders,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.hour - b.hour);

    return {
      period: `${dateFrom} 至 ${dateTo}`,
      totalRevenue,
      paymentBreakdown,
      hourlyData,
    };
  }

  async getMenuReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<MenuReport> {
    const startDate = dayjs(dateFrom).startOf('day').toDate();
    const endDate = dayjs(dateTo).endOf('day').toDate();

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: OrderStatus.COMPLETED,
      },
      relations: ['items', 'items.menuItem', 'items.menuItem.category'],
    });

    const itemMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        quantity: number;
        revenue: number;
        categoryId: string;
      }
    >();

    const categoryMap = new Map<
      string,
      {
        category: string;
        categoryId: string;
        quantity: number;
        revenue: number;
      }
    >();

    for (const order of orders) {
      if (order.items) {
        for (const item of order.items) {
          if (
            item.status !== 'cancelled' &&
            item.status !== 'refunded'
          ) {
            const categoryName = item.menuItem?.category?.name || '未分类';
            const categoryId = item.menuItem?.category?.id || '';

            const existingItem = itemMap.get(item.menuItemId) || {
              id: item.menuItemId,
              name: item.name,
              category: categoryName,
              quantity: 0,
              revenue: 0,
              categoryId,
            };
            existingItem.quantity += item.quantity;
            existingItem.revenue += item.subtotal;
            itemMap.set(item.menuItemId, existingItem);

            const existingCategory = categoryMap.get(categoryId) || {
              category: categoryName,
              categoryId,
              quantity: 0,
              revenue: 0,
            };
            existingCategory.quantity += item.quantity;
            existingCategory.revenue += item.subtotal;
            categoryMap.set(categoryId, existingCategory);
          }
        }
      }
    }

    const topSelling = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);

    const categorySummary = Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    return {
      topSelling,
      categorySummary,
    };
  }

  async getTableReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<TableReport> {
    const startDate = dayjs(dateFrom).startOf('day').toDate();
    const endDate = dayjs(dateTo).endOf('day').toDate();

    const allTables = await this.tableRepository.find({
      where: { isActive: true },
    });

    const statusBreakdown = {
      vacant: allTables.filter((t) => t.status === TableStatus.VACANT).length,
      occupied: allTables.filter((t) => t.status === TableStatus.OCCUPIED).length,
      cleaning: allTables.filter((t) => t.status === TableStatus.CLEANING).length,
      reserved: allTables.filter((t) => t.status === TableStatus.RESERVED).length,
    };

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: OrderStatus.COMPLETED,
        orderType: OrderType.DINE_IN,
      },
      relations: ['table'],
    });

    const tableMap = new Map<
      string,
      {
        tableNumber: string;
        orderCount: number;
        totalRevenue: number;
      }
    >();

    for (const order of orders) {
      if (order.table) {
        const tableNumber = order.table.tableNumber;
        const existing = tableMap.get(tableNumber) || {
          tableNumber,
          orderCount: 0,
          totalRevenue: 0,
        };
        existing.orderCount += 1;
        existing.totalRevenue += order.paidAmount;
        tableMap.set(tableNumber, existing);
      }
    }

    const tableTurnover = Array.from(tableMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );

    return {
      totalTables: allTables.length,
      statusBreakdown,
      tableTurnover,
    };
  }

  async getMemberReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<MemberReport> {
    const startDate = dayjs(dateFrom).startOf('day').toDate();
    const endDate = dayjs(dateTo).endOf('day').toDate();

    const totalMembers = await this.memberRepository.count();

    const newMembers = await this.memberRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const activeMembers = await this.memberRepository
      .createQueryBuilder('member')
      .where('member.lastVisitAt >= :startDate', { startDate })
      .getCount();

    const levelBreakdownRaw = await this.memberRepository
      .createQueryBuilder('member')
      .select('member.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('member.level')
      .getRawMany();

    const levelBreakdown = levelBreakdownRaw.map((r) => ({
      level: r.level,
      count: parseInt(r.count, 10),
    }));

    const memberOrders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: OrderStatus.COMPLETED,
      },
    });

    const memberOrderIds = new Set(
      memberOrders.filter((o) => o.memberId).map((o) => o.memberId),
    );

    const memberRevenue = memberOrders
      .filter((o) => o.memberId)
      .reduce((sum, o) => sum + o.paidAmount, 0);

    const averageSpend =
      memberOrderIds.size > 0 ? memberRevenue / memberOrderIds.size : 0;

    return {
      totalMembers,
      newMembers,
      activeMembers,
      levelBreakdown,
      memberRevenue,
      averageSpend,
    };
  }

  async getDashboardData(): Promise<{
    todayRevenue: number;
    todayOrders: number;
    averageOrderValue: number;
    tableUtilization: number;
    topItems: Array<{ name: string; quantity: number }>;
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      status: string;
      createdAt: Date;
    }>;
  }> {
    const today = dayjs();
    const startDate = today.startOf('day').toDate();
    const endDate = today.endOf('day').toDate();

    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const completedOrders = await this.orderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: OrderStatus.COMPLETED,
      },
      relations: ['items'],
    });

    const todayRevenue = completedOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const todayOrders = completedOrders.length;
    const averageOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;

    const allTables = await this.tableRepository.count({
      where: { isActive: true },
    });
    const occupiedTables = await this.tableRepository.count({
      where: { status: TableStatus.OCCUPIED, isActive: true },
    });
    const tableUtilization = allTables > 0 ? (occupiedTables / allTables) * 100 : 0;

    const itemMap = new Map<string, { name: string; quantity: number }>();

    for (const order of completedOrders) {
      if (order.items) {
        for (const item of order.items) {
          if (
            item.status !== 'cancelled' &&
            item.status !== 'refunded'
          ) {
            const existing = itemMap.get(item.name) || {
              name: item.name,
              quantity: 0,
            };
            existing.quantity += item.quantity;
            itemMap.set(item.name, existing);
          }
        }
      }
    }

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const recentOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    }));

    return {
      todayRevenue,
      todayOrders,
      averageOrderValue,
      tableUtilization,
      topItems,
      recentOrders,
    };
  }
}
