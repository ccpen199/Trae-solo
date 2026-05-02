import { OrderStatus, PaymentStatus, RoomStatus } from '../constants/enums';
import { addDays, startOfDay, differenceInDays, format } from 'date-fns';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import redis from '../lib/redis';
import {
  NotFoundError,
  StatusConflictError,
  BusinessRuleViolationError,
  ManualReviewRequiredError,
} from '../errors/AppError';
import roomCalendarEngine from './RoomCalendarEngine';
import priceSyncEngine from './PriceSyncEngine';
import cleaningDispatchEngine from './CleaningDispatchEngine';
import manualReviewService from '../services/ManualReviewService';
import optimisticLockService from '../services/OptimisticLockService';

export interface CreateOrderInput {
  propertyId: string;
  guestId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  specialRequests?: string;
  guestInfo?: Record<string, unknown>;
  userId: string;
}

export interface OrderUpdateInput {
  checkInDate?: Date;
  checkOutDate?: Date;
  guestCount?: number;
  specialRequests?: string;
  guestInfo?: Record<string, unknown>;
}

export interface CancelOrderInput {
  reason: string;
  userId: string;
}

export interface RefundInput {
  amount: number;
  reason: string;
  userId: string;
}

export interface CheckInInput {
  checkInCode: string;
  userId: string;
}

export interface OrderStatistics {
  total: number;
  byStatus: Record<string, number>;
  totalRevenue: number;
  averageOrderValue: number;
  occupancyRate: number;
}

export class OrderManagementEngine {
  private readonly LOCK_PREFIX = 'order:lock:';
  private readonly LOCK_TTL = 60;
  private readonly ORDER_EXPIRY_MINUTES = 30;

  async createOrder(input: CreateOrderInput): Promise<{ orderId: string; orderNo: string }> {
    const { propertyId, guestId, checkInDate, checkOutDate, guestCount, specialRequests, guestInfo, userId } = input;

    const start = startOfDay(checkInDate);
    const end = startOfDay(checkOutDate);
    const nights = differenceInDays(end, start);

    if (nights <= 0) {
      throw new BusinessRuleViolationError(
        '入住日期必须早于退房日期',
        'DATE_VALIDATION_RULE'
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundError('房源');
    }

    if (!property.isActive) {
      throw new BusinessRuleViolationError(
        '该房源已下架，无法预订',
        'PROPERTY_STATUS_RULE'
      );
    }

    if (guestCount > property.maxGuests) {
      throw new BusinessRuleViolationError(
        `入住人数不能超过该房源的最大容纳人数 ${property.maxGuests}`,
        'GUEST_COUNT_RULE'
      );
    }

    const availability = await roomCalendarEngine.checkAvailability(propertyId, start, end);

    if (!availability.available) {
      const conflictDates = availability.conflicts.map(c => format(c.date, 'yyyy-MM-dd')).join(', ');
      throw new StatusConflictError(
        `以下日期不可用：${conflictDates}`,
        'Calendar',
        propertyId
      );
    }

    const priceResult = await priceSyncEngine.calculatePrice(propertyId, start, end, guestCount);

    const orderNo = await this.generateOrderNo();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          propertyId,
          guestId,
          checkInDate: start,
          checkOutDate: end,
          nights,
          guestCount,
          roomPrice: priceResult.totalPrice,
          cleaningFee: Number(property.cleaningFee),
          depositAmount: Number(property.depositAmount),
          totalAmount: priceResult.totalPrice + Number(property.cleaningFee) + Number(property.depositAmount),
          status: OrderStatus.PENDING,
          specialRequests,
          guestInfo: guestInfo as object,
          version: 1,
        },
      });

      await roomCalendarEngine.bookCalendar(propertyId, newOrder.id, start, end, userId);

      return newOrder;
    });

    logger.info(`Created order ${order.orderNo} for property ${propertyId}`, {
      userId,
      guestId,
      checkIn: format(start, 'yyyy-MM-dd'),
      checkOut: format(end, 'yyyy-MM-dd'),
      totalAmount: order.totalAmount.toString(),
    });

    return { orderId: order.id, orderNo: order.orderNo };
  }

  async confirmOrder(orderId: string, userId: string): Promise<void> {
    const lockKey = `${this.LOCK_PREFIX}${orderId}`;
    const lockValue = `${Date.now()}`;

    const lockAcquired = await redis.set(lockKey, lockValue, 'EX', this.LOCK_TTL, 'NX');

    if (!lockAcquired) {
      throw new StatusConflictError(
        '订单正在处理中，请稍后重试',
        'Order',
        orderId
      );
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundError('订单');
      }

      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
        throw new BusinessRuleViolationError(
          '只能确认待处理或已支付的订单',
          'ORDER_STATUS_RULE'
        );
      }

      if (order.isLocked) {
        throw new BusinessRuleViolationError(
          '订单已被锁定，无法确认',
          'ORDER_LOCK_RULE'
        );
      }

      const checkInCode = this.generateCheckInCode();
      const doorLockCode = this.generateDoorLockCode();

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          confirmedAt: new Date(),
          checkInCode,
          doorLockCode,
          version: { increment: 1 },
        },
      });

      logger.info(`Confirmed order ${orderId}`, {
        userId,
        orderNo: order.orderNo,
      });
    } finally {
      await redis.del(lockKey);
    }
  }

  async checkIn(orderId: string, _input: CheckInInput): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('订单');
    }

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PAID) {
      throw new BusinessRuleViolationError(
        '只能为已确认或已支付的订单办理入住',
        'ORDER_STATUS_RULE'
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CHECKED_IN,
        checkedInAt: new Date(),
        version: { increment: 1 },
      },
    });

    logger.info(`Checked in for order ${orderId}`);
  }

  async checkOut(orderId: string, userId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { property: true },
    });

    if (!order) {
      throw new NotFoundError('订单');
    }

    if (order.status !== OrderStatus.CHECKED_IN) {
      throw new BusinessRuleViolationError(
        '只能为已入住的订单办理退房',
        'ORDER_STATUS_RULE'
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CHECKED_OUT,
          checkedOutAt: new Date(),
          version: { increment: 1 },
        },
      });

      await roomCalendarEngine.releaseCalendar(orderId, userId);

      await cleaningDispatchEngine.createCleaningTask({
        orderId,
        propertyId: order.propertyId,
        checkOutDate: order.checkOutDate,
        userId,
      });
    });

    logger.info(`Checked out for order ${orderId}`, { userId });
  }

  async cancelOrder(orderId: string, input: CancelOrderInput): Promise<void> {
    const { reason, userId } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { property: true },
    });

    if (!order) {
      throw new NotFoundError('订单');
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      return;
    }

    if (order.status === OrderStatus.CHECKED_IN || order.status === OrderStatus.CHECKED_OUT) {
      throw new BusinessRuleViolationError(
        '已入住或已退房的订单无法取消',
        'ORDER_CANCELLATION_RULE'
      );
    }

    if (order.isLocked) {
      throw new BusinessRuleViolationError(
        '订单已被锁定，无法取消',
        'ORDER_LOCK_RULE'
      );
    }

    const refundAmount = await this.calculateRefundAmount(order);

    const needsReview = await manualReviewService.requiresManualReview(
      'ORDER_CANCEL',
      orderId,
      reason,
      {
        orderId,
        totalAmount: Number(order.totalAmount),
        refundAmount,
        userId,
      }
    );

    if (needsReview) {
      throw new ManualReviewRequiredError(
        '',
        `退款金额超过订单总金额的50%，需要人工复核`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledReason: reason,
          refundAmount: refundAmount,
          version: { increment: 1 },
        },
      });

      await roomCalendarEngine.releaseCalendar(orderId, userId);
    });

    logger.info(`Cancelled order ${orderId}`, {
      userId,
      reason,
      refundAmount,
    });
  }

  async processRefund(orderId: string, input: RefundInput): Promise<void> {
    const { amount, reason, userId } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundError('订单');
    }

    const totalPaid = order.payments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalRefunded = order.payments
      .filter(p => p.status === PaymentStatus.REFUNDED || p.status === PaymentStatus.PARTIALLY_REFUNDED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const availableRefund = totalPaid - totalRefunded;

    if (amount > availableRefund) {
      throw new BusinessRuleViolationError(
        `退款金额不能超过可退款金额 ${availableRefund}`,
        'REFUND_AMOUNT_RULE'
      );
    }

    const needsReview = await manualReviewService.requiresManualReview(
      'ORDER_REFUND',
      orderId,
      reason,
      {
        orderId,
        refundAmount: amount,
        userId,
      }
    );

    if (needsReview) {
      throw new ManualReviewRequiredError(
        '',
        `退款金额超过1000元，需要人工复核`
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          refundAmount: Number(order.refundAmount) + amount,
          version: { increment: 1 },
        },
      });

      const paymentNo = await this.generatePaymentNo();
      await tx.payment.create({
        data: {
          paymentNo,
          orderId,
          userId,
          amount,
          paymentMethod: 'REFUND',
          status: PaymentStatus.REFUNDED,
          refundReason: reason,
          refundedAt: new Date(),
        },
      });
    });

    logger.info(`Processed refund for order ${orderId}`, {
      userId,
      amount,
      reason,
    });
  }

  async updateOrder(orderId: string, input: OrderUpdateInput, userId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('订单');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessRuleViolationError(
        '只能修改待处理的订单',
        'ORDER_UPDATE_RULE'
      );
    }

    if (input.checkInDate || input.checkOutDate) {
      throw new BusinessRuleViolationError(
        '无法修改入住/退房日期，请取消后重新预订',
        'ORDER_DATE_CHANGE_RULE'
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        guestCount: input.guestCount,
        specialRequests: input.specialRequests,
        guestInfo: input.guestInfo as object,
        version: { increment: 1 },
      },
    });

    logger.info(`Updated order ${orderId}`, { userId });
  }

  async getOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            images: true,
            checkInTime: true,
            checkOutTime: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            realName: true,
          },
        },
        payments: true,
        reviews: true,
      },
    });

    if (!order) {
      throw new NotFoundError('订单');
    }

    return order;
  }

  async getOrderStatistics(userId: string, userRole: string): Promise<OrderStatistics> {
    let where: Record<string, unknown> = {};

    if (userRole === 'LANDLORD') {
      where = {
        property: {
          ownerId: userId,
        },
      };
    } else if (userRole === 'GUEST') {
      where = { guestId: userId };
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        checkInDate: true,
        checkOutDate: true,
      },
    });

    const stats: OrderStatistics = {
      total: orders.length,
      byStatus: {},
      totalRevenue: 0,
      averageOrderValue: 0,
      occupancyRate: 0,
    };

    const completedStatuses = [OrderStatus.CONFIRMED, OrderStatus.PAID, OrderStatus.CHECKED_IN, OrderStatus.CHECKED_OUT];
    const completedOrders = orders.filter(o => completedStatuses.includes(o.status));

    for (const order of orders) {
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;

      if (completedStatuses.includes(order.status)) {
        stats.totalRevenue += Number(order.totalAmount);
      }
    }

    if (completedOrders.length > 0) {
      stats.averageOrderValue = stats.totalRevenue / completedOrders.length;
    }

    if (userRole === 'LANDLORD' && orders.length > 0) {
      const totalNights = orders.reduce((sum, o) => sum + differenceInDays(o.checkOutDate, o.checkInDate), 0);
      const completedNights = completedOrders.reduce((sum, o) => sum + differenceInDays(o.checkOutDate, o.checkInDate), 0);
      
      if (totalNights > 0) {
        stats.occupancyRate = (completedNights / totalNights) * 100;
      }
    }

    return stats;
  }

  private async calculateRefundAmount(order: {
    totalAmount: number | string;
    checkInDate: Date;
    status: OrderStatus;
    property: { cancellationPolicy: string };
  }): Promise<number> {
    const totalAmount = Number(order.totalAmount);
    const checkInDate = new Date(order.checkInDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;

    switch (order.property.cancellationPolicy) {
      case 'flexible':
        if (daysUntilCheckIn >= 1) {
          refundPercentage = 1;
        } else {
          refundPercentage = 0.5;
        }
        break;
      case 'moderate':
        if (daysUntilCheckIn >= 5) {
          refundPercentage = 1;
        } else if (daysUntilCheckIn >= 1) {
          refundPercentage = 0.5;
        } else {
          refundPercentage = 0;
        }
        break;
      case 'strict':
        if (daysUntilCheckIn >= 14) {
          refundPercentage = 0.5;
        } else {
          refundPercentage = 0;
        }
        break;
      default:
        refundPercentage = 1;
    }

    return Math.round(totalAmount * refundPercentage * 100) / 100;
  }

  private async generateOrderNo(): Promise<string> {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `HS${dateStr}${random}`;
  }

  private async generatePaymentNo(): Promise<string> {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `PAY${dateStr}${random}`;
  }

  private generateCheckInCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateDoorLockCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const orderManagementEngine = new OrderManagementEngine();
export default orderManagementEngine;
