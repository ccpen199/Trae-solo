import { OrderStatus, AuditAction, TourGroupStatus } from '../types/constants';
import prisma from '../lib/prisma';
import { JWTPayload, PaginatedResponse } from '../types';
import { createAuditLog, getChangeSummary } from '../services/audit.service';
import { generateOrderNo } from '../utils/auth';
import { inventoryEngine } from '../engines/inventory.engine';

interface CreateOrderParams {
  groupId: string;
  contactName: string;
  contactPhone: string;
  adultCount: number;
  childCount: number;
  specialRequests?: string;
  passengers?: Array<{
    isChild: boolean;
    values: Record<string, any>;
  }>;
}

interface OrderListParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  touristId?: string;
  groupId?: string;
}

export class OrderService {
  async createOrder(user: JWTPayload, params: CreateOrderParams) {
    const { groupId, contactName, contactPhone, adultCount, childCount, specialRequests, passengers } = params;

    const group = await prisma.tourGroup.findUnique({
      where: { id: groupId },
      include: { tour: true },
    });

    if (!group) {
      throw new Error('团期不存在');
    }

    if (group.status !== TourGroupStatus.PUBLISHED) {
      throw new Error('团期未发布，无法报名');
    }

    const totalPassengers = adultCount + childCount;

    if (totalPassengers <= 0) {
      throw new Error('报名人数必须大于0');
    }

    const stockCheck = await inventoryEngine.checkStock(groupId, totalPassengers);
    if (!stockCheck.available) {
      throw new Error(stockCheck.message);
    }

    await inventoryEngine.lockStock(user, groupId, totalPassengers);

    const orderNo = generateOrderNo();
    const totalAmount = (group.price.toNumber() * adultCount) + (group.childPrice.toNumber() * childCount);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          groupId,
          touristId: user.userId,
          contactName,
          contactPhone,
          totalAmount,
          paidAmount: 0,
          status: OrderStatus.PENDING_PAYMENT,
          adultCount,
          childCount,
          specialRequests,
        },
      });

      if (passengers && passengers.length === totalPassengers) {
        for (const passenger of passengers) {
          await tx.passenger.create({
            data: {
              orderId: newOrder.id,
              name: passenger.values.name,
              idType: passenger.values.idType || 'ID',
              idNumber: passenger.values.idNumber,
              phone: passenger.values.phone,
              isChild: passenger.isChild,
              birthDate: passenger.values.birthDate ? new Date(passenger.values.birthDate) : null,
              gender: passenger.values.gender,
              specialNeeds: passenger.values.specialNeeds,
            },
          });
        }
      }

      return newOrder;
    });

    await createAuditLog({
      user,
      action: AuditAction.CREATE,
      entityType: 'Order',
      entityId: order.id,
      entityName: order.orderNo,
      newValue: {
        orderNo: order.orderNo,
        groupCode: group.code,
        adultCount,
        childCount,
        totalAmount: totalAmount.toString(),
      },
    });

    return order;
  }

  async getOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        group: {
          include: {
            tour: true,
            itineraryDays: {
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
        tourist: {
          select: {
            id: true,
            username: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        passengers: true,
        contracts: true,
        insurance: true,
        payments: true,
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  }

  async getOrderList(params: OrderListParams): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 20,
      status,
      touristId,
      groupId,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: any = {
      isArchived: false,
    };

    if (status) {
      where.status = status;
    }

    if (touristId) {
      where.touristId = touristId;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          group: {
            include: {
              tour: true,
            },
          },
          tourist: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: { passengers: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateOrderStatus(user: JWTPayload, orderId: string, newStatus: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { group: true },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const oldValue = { status: order.status };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    if (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.REFUNDED) {
      const totalPassengers = order.adultCount + order.childCount;
      await inventoryEngine.releaseStock(user, order.groupId, totalPassengers);
    }

    await createAuditLog({
      user,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'Order',
      entityId: orderId,
      entityName: order.orderNo,
      oldValue,
      newValue: { status: newStatus },
      changes: getChangeSummary(oldValue, { status: newStatus }),
    });

    return updatedOrder;
  }

  async processPayment(user: JWTPayload, orderId: string, amount: number, method: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { group: true },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT && order.status !== OrderStatus.DRAFT) {
      throw new Error('订单状态不支持支付');
    }

    const newPaidAmount = order.paidAmount.toNumber() + amount;

    if (newPaidAmount > order.totalAmount.toNumber()) {
      throw new Error('支付金额不能超过订单总金额');
    }

    const paymentNo = this.generatePaymentNo();

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId,
          paymentNo,
          amount,
          method,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      const isFullyPaid = newPaidAmount >= order.totalAmount.toNumber();
      const newStatus = isFullyPaid ? OrderStatus.PAID : order.status;

      return tx.order.update({
        where: { id: orderId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentTime: isFullyPaid ? new Date() : order.paymentTime,
        },
      });
    });

    await createAuditLog({
      user,
      action: AuditAction.PAYMENT,
      entityType: 'Order',
      entityId: orderId,
      entityName: order.orderNo,
      newValue: {
        paymentNo,
        amount: amount.toString(),
        method,
        newStatus: updatedOrder.status,
      },
    });

    return updatedOrder;
  }

  async cancelOrder(user: JWTPayload, orderId: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { group: true },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if ([OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new Error('该订单状态无法取消');
    }

    const totalPassengers = order.adultCount + order.childCount;
    await inventoryEngine.releaseStock(user, order.groupId, totalPassengers);

    const oldValue = { status: order.status };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        specialRequests: reason ? `${order.specialRequests || ''}\n取消原因: ${reason}`.trim() : order.specialRequests,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'Order',
      entityId: orderId,
      entityName: order.orderNo,
      oldValue,
      newValue: { status: OrderStatus.CANCELLED, reason },
      changes: getChangeSummary(oldValue, { status: OrderStatus.CANCELLED }),
    });

    return updatedOrder;
  }

  async confirmOrder(user: JWTPayload, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new Error('只有已支付的订单可以确认');
    }

    const passengers = await prisma.passenger.count({
      where: { orderId },
    });

    const expectedPassengers = order.adultCount + order.childCount;
    if (passengers < expectedPassengers) {
      throw new Error('请先补充完整的乘客信息');
    }

    const oldValue = { status: order.status };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED },
    });

    await createAuditLog({
      user,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'Order',
      entityId: orderId,
      entityName: order.orderNo,
      oldValue,
      newValue: { status: OrderStatus.CONFIRMED },
      changes: getChangeSummary(oldValue, { status: OrderStatus.CONFIRMED }),
    });

    return updatedOrder;
  }

  private generatePaymentNo(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY${timestamp}${random}`;
  }
}

export const orderService = new OrderService();
