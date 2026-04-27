import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { orderFlowEngine } from '../engines/orderFlow';
import { OrderStatus, UserRole, OrderFlowContext } from '../types';

export interface CreateOrderParams {
  demandId: string;
  quoteId: string;
  customerId: string;
  title: string;
  address: string;
  province?: string;
  city?: string;
  district?: string;
  contactName: string;
  contactPhone: string;
}

export interface SignContractParams {
  orderId: string;
  customerId: string;
  contractData?: Record<string, any>;
}

export interface RecordPaymentParams {
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paidBy: string;
  paidByRole: UserRole;
}

export interface UpdateOrderStatusParams {
  orderId: string;
  targetStatus: OrderStatus;
  actorId: string;
  actorRole: UserRole;
  reason?: string;
  data?: Record<string, any>;
}

export class OrderService {
  async createOrder(params: CreateOrderParams): Promise<any> {
    const { demandId, quoteId, customerId, title, address, province, city, district, contactName, contactPhone } = params;

    try {
      const demand = await prisma.demand.findUnique({
        where: { id: demandId },
        include: {
          design: {
            include: {
              quote: true
            }
          }
        }
      });

      if (!demand) {
        throw new Error('需求不存在');
      }

      const quote = await prisma.quote.findUnique({
        where: { id: quoteId }
      });

      if (!quote) {
        throw new Error('报价单不存在');
      }

      if (quote.status !== 'CONFIRMED') {
        throw new Error(`报价单未确认，当前状态: ${quote.status}`);
      }

      const existingOrder = await prisma.order.findUnique({
        where: { demandId }
      });

      if (existingOrder) {
        throw new Error('该需求已存在订单');
      }

      const orderNumber = await this.generateOrderNumber();

      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            demandId,
            quoteId,
            customerId,
            title,
            status: 'DEMAND_SUBMITTED' as OrderStatus,
            totalAmount: quote.finalAmount,
            paidAmount: 0,
            outstandingAmount: quote.finalAmount,
            address,
            province,
            city,
            district,
            contactName,
            contactPhone
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: newOrder.id,
            newStatus: 'DEMAND_SUBMITTED' as OrderStatus,
            actorId: customerId,
            actorRole: 'CUSTOMER' as UserRole,
            reason: '订单创建'
          }
        });

        await tx.demand.update({
          where: { id: demandId },
          data: { status: 'CONVERTED_TO_ORDER' as any }
        });

        return newOrder;
      });

      await auditService.createLog({
        entityType: 'Order',
        entityId: order.id,
        action: 'ORDER_CREATED',
        actorId: customerId,
        actorRole: 'CUSTOMER',
        newState: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount.toNumber()
        },
        reason: '订单创建成功'
      });

      logger.info(`[OrderService] 订单创建成功: orderNumber=${orderNumber}`);

      return order;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Order',
        exceptionType: 'BUSINESS_ERROR',
        message: `创建订单失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async signContract(params: SignContractParams): Promise<any> {
    const { orderId, customerId, contractData } = params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.customerId !== customerId) {
        throw new Error('客户无权限操作此订单');
      }

      const transitionContext: OrderFlowContext = {
        orderId,
        currentStatus: order.status,
        previousStatus: null,
        actorId: customerId,
        actorRole: 'CUSTOMER',
        data: contractData || {},
        metadata: {},
        timestamp: new Date()
      };

      const previousState = {
        status: order.status,
        contractSignedAt: order.contractSignedAt
      };

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'CONTRACT_SIGNED' as OrderStatus,
            contractSignedAt: new Date()
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.status,
            newStatus: 'CONTRACT_SIGNED' as OrderStatus,
            actorId: customerId,
            actorRole: 'CUSTOMER' as UserRole,
            reason: '签约成功'
          }
        });

        return newOrder;
      });

      await auditService.createLog({
        entityType: 'Order',
        entityId: orderId,
        action: 'CONTRACT_SIGNED',
        actorId: customerId,
        actorRole: 'CUSTOMER',
        previousState,
        newState: {
          status: updatedOrder.status,
          contractSignedAt: updatedOrder.contractSignedAt
        },
        reason: '客户签约成功'
      });

      logger.info(`[OrderService] 订单签约成功: orderId=${orderId}`);

      return updatedOrder;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: params.orderId,
        entityType: 'Order',
        entityId: params.orderId,
        exceptionType: 'BUSINESS_ERROR',
        message: `签约失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async recordPayment(params: RecordPaymentParams): Promise<any> {
    const { orderId, amount, paymentMethod, transactionId, paidBy, paidByRole } = params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (amount <= 0) {
        throw new Error('支付金额必须大于0');
      }

      const paymentNumber = await this.generatePaymentNumber();

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            orderId,
            paymentNumber,
            amount,
            paymentMethod,
            paymentStatus: 'COMPLETED',
            transactionId,
            paidAt: new Date()
          }
        });

        const newPaidAmount = order.paidAmount.toNumber() + amount;
        const newOutstandingAmount = order.totalAmount.toNumber() - newPaidAmount;

        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            paidAmount: newPaidAmount,
            outstandingAmount: Math.max(0, newOutstandingAmount),
            paymentReceivedAt: newPaidAmount >= order.totalAmount.toNumber() ? new Date() : order.paymentReceivedAt,
            status: newPaidAmount >= order.totalAmount.toNumber() ? 'PAYMENT_RECEIVED' as OrderStatus : order.status
          }
        });

        if (newPaidAmount >= order.totalAmount.toNumber()) {
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              previousStatus: order.status,
              newStatus: 'PAYMENT_RECEIVED' as OrderStatus,
              actorId: paidBy,
              actorRole: paidByRole,
              reason: '全款支付完成'
            }
          });
        }

        return { payment, order: updatedOrder };
      });

      await auditService.createLog({
        entityType: 'Order',
        entityId: orderId,
        action: 'PAYMENT_RECEIVED',
        actorId: paidBy,
        actorRole: paidByRole,
        previousState: {
          paidAmount: order.paidAmount.toNumber(),
          outstandingAmount: order.outstandingAmount.toNumber()
        },
        newState: {
          paidAmount: result.order.paidAmount.toNumber(),
          outstandingAmount: result.order.outstandingAmount.toNumber()
        },
        reason: '收到付款',
        metadata: {
          amount,
          paymentMethod,
          paymentNumber: result.payment.paymentNumber
        }
      });

      logger.info(`[OrderService] 支付记录成功: orderId=${orderId}, amount=${amount}`);

      return result;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: params.orderId,
        entityType: 'Order',
        entityId: params.orderId,
        exceptionType: 'PAYMENT_ERROR',
        message: `记录支付失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async updateOrderStatus(params: UpdateOrderStatusParams): Promise<any> {
    const { orderId, targetStatus, actorId, actorRole, reason, data } = params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      const canTransition = orderFlowEngine.canTransition(
        order.status,
        targetStatus,
        actorRole
      );

      if (!canTransition) {
        throw new Error(`状态转换不允许: ${order.status} -> ${targetStatus}, 角色: ${actorRole}`);
      }

      const previousState = { status: order.status };

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: targetStatus,
            completedAt: targetStatus === 'COMPLETED' ? new Date() : order.completedAt
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.status,
            newStatus: targetStatus,
            actorId,
            actorRole,
            reason,
            metadata: data
          }
        });

        return newOrder;
      });

      await auditService.createLog({
        entityType: 'Order',
        entityId: orderId,
        action: `STATUS_CHANGED_${targetStatus}`,
        actorId,
        actorRole,
        previousState,
        newState: { status: updatedOrder.status },
        reason: reason || `状态变更为 ${targetStatus}`,
        metadata: data
      });

      logger.info(`[OrderService] 订单状态更新: orderId=${orderId}, ${order.status} -> ${targetStatus}`);

      return updatedOrder;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: params.orderId,
        entityType: 'Order',
        entityId: params.orderId,
        exceptionType: 'STATE_TRANSITION_ERROR',
        message: `更新订单状态失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<any> {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        demand: {
          include: {
            designer: { select: { id: true, name: true, phone: true } }
          }
        },
        quote: true,
        split: true,
        productionTasks: true,
        installations: {
          include: {
            installer: { select: { id: true, name: true, phone: true } }
          }
        },
        orderStatusHistory: {
          orderBy: { createdAt: 'asc' }
        },
        payments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async getOrdersByCustomer(customerId: string): Promise<any[]> {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        quote: { select: { id: true, quoteNumber: true } },
        orderStatusHistory: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    return prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const count = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `OD${dateStr}${sequence}`;
  }

  private async generatePaymentNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const count = await prisma.payment.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `PY${dateStr}${sequence}`;
  }
}

export const orderService = new OrderService();
export default OrderService;
