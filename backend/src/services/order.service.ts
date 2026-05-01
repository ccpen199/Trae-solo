import { PrismaClient, OrderStatus, UserRole } from '@prisma/client';
import prisma from '../config/prisma';
import { attributionLinkEngine } from '../engines/attribution-link';
import { commissionCalculatorEngine } from '../engines/commission-calculator';
import { fraudDetectionEngine } from '../engines/fraud-detection';
import { config } from '../config';

export interface CreateOrderParams {
  userId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  sourceType?: 'referral_code' | 'share_link' | 'qrcode';
  sourceValue?: string;
  ip?: string;
  deviceId?: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  orderNo?: string;
  totalAmount?: number;
  message?: string;
}

export class OrderService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const { userId, items, sourceType, sourceValue, ip, deviceId } = params;

    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
    });

    if (products.length !== items.length) {
      return {
        success: false,
        message: '部分商品不存在',
      };
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    let totalAmount = 0;
    const orderItems: {
      productId: string;
      productName: string;
      productSku: string | null;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      commissionSnapshot: {
        baseRate: number;
        levelRates?: Record<string, number>;
      };
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const unitPrice = product.price.toNumber();
      const itemTotalPrice = unitPrice * item.quantity;
      totalAmount += itemTotalPrice;

      const levelRates: Record<string, number> = {};
      if (product.levelRates && typeof product.levelRates === 'object') {
        const rates = product.levelRates as Record<string, number>;
        for (const [level, rate] of Object.entries(rates)) {
          levelRates[level] = rate;
        }
      }

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotalPrice,
        commissionSnapshot: {
          baseRate: product.commissionRate.toNumber(),
          levelRates: Object.keys(levelRates).length > 0 ? levelRates : undefined,
        },
      });
    }

    const orderNo = this.generateOrderNo();

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          userId,
          totalAmount,
          payAmount: totalAmount,
          status: 'PENDING_PAYMENT',
          orderIp: ip,
          orderDevice: deviceId,
        },
      });

      for (const item of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            commissionSnapshot: item.commissionSnapshot,
          },
        });
      }

      return newOrder;
    });

    return {
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
      totalAmount,
    };
  }

  async confirmPayment(orderId: string): Promise<OrderResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        attribution: true,
      },
    });

    if (!order) {
      return {
        success: false,
        message: '订单不存在',
      };
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return {
        success: false,
        message: '订单状态不正确',
      };
    }

    await fraudDetectionEngine.detect({
      userId: order.userId,
      ip: order.orderIp || undefined,
      deviceId: order.orderDevice || undefined,
      eventType: 'ORDER',
      eventData: {
        orderId: order.id,
        amount: order.payAmount.toNumber(),
        itemCount: order.items.length,
      },
    });

    const afterSaleEndTime = new Date();
    afterSaleEndTime.setDate(afterSaleEndTime.getDate() + config.AFTER_SALE_DAYS);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          payTime: new Date(),
          afterSaleEndTime,
        },
      });
    });

    if (order.attribution) {
      for (const item of order.items) {
        const snapshot = item.commissionSnapshot as {
          baseRate: number;
          levelRates?: Record<string, number>;
        } | undefined;

        await commissionCalculatorEngine.calculateFrozenCommissions({
          orderId: order.id,
          orderAmount: item.totalPrice.toNumber(),
          productId: item.productId,
          uplineId: order.attribution.uplineId || undefined,
          upline2Id: order.attribution.upline2Id || undefined,
          upline3Id: order.attribution.upline3Id || undefined,
          commissionSnapshot: snapshot,
        });
      }
    }

    return {
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
    };
  }

  async confirmOrderAttribution(params: {
    orderId: string;
    sourceType: 'referral_code' | 'share_link' | 'qrcode';
    sourceValue: string;
  }): Promise<OrderResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
      include: { attribution: true },
    });

    if (!order) {
      return {
        success: false,
        message: '订单不存在',
      };
    }

    if (order.attribution) {
      return {
        success: false,
        message: '订单已完成归因',
      };
    }

    const result = await attributionLinkEngine.attribute({
      buyerId: order.userId,
      orderId: order.id,
      sourceType: params.sourceType,
      sourceValue: params.sourceValue,
      ip: order.orderIp || undefined,
      deviceId: order.orderDevice || undefined,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.message || '归因失败',
      };
    }

    return {
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
    };
  }

  async confirmDelivery(orderId: string): Promise<OrderResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        message: '订单不存在',
      };
    }

    if (order.status !== 'SHIPPED' && order.status !== 'PAID') {
      return {
        success: false,
        message: '订单状态不正确',
      };
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        receiveTime: new Date(),
      },
    });

    return {
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
    };
  }

  async completeAfterSale(orderId: string): Promise<OrderResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { commissions: true },
    });

    if (!order) {
      return {
        success: false,
        message: '订单不存在',
      };
    }

    if (order.status !== 'DELIVERED' && order.status !== 'AFTER_SALE_PERIOD') {
      return {
        success: false,
        message: '订单状态不正确',
      };
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
      },
    });

    const frozenCommissions = order.commissions.filter(
      c => c.status === 'FROZEN' || c.status === 'PENDING_SETTLEMENT'
    );

    if (frozenCommissions.length > 0) {
      await commissionCalculatorEngine.settleCommissions({
        orderId,
        commissions: frozenCommissions,
      });
    }

    return {
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
    };
  }

  async cancelOrder(orderId: string, reason: string): Promise<OrderResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return {
        success: false,
        message: '订单不存在',
      };
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return {
        success: false,
        message: '订单状态不允许取消',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
        },
      });

      await commissionCalculatorEngine.cancelCommissionsByOrder(orderId, reason);
    });

    return {
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
    };
  }

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${dateStr}${timestamp}${random}`;
  }

  async getOrderById(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        attribution: {
          include: { upline: true },
        },
        commissions: true,
      },
    });
  }

  async getUserOrders(userId: string, status?: OrderStatus) {
    const where: { userId: string; status?: OrderStatus } = { userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const orderService = new OrderService();
