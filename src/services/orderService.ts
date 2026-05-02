import { databaseService } from './databaseService';
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
      const demand = await databaseService.findUnique('demand', { id: demandId });

      if (!demand) {
        throw new Error('需求不存在');
      }

      const quote = await databaseService.findUnique('quote', { id: quoteId });

      if (!quote) {
        throw new Error('报价单不存在');
      }

      if (quote.status !== 'CONFIRMED') {
        throw new Error(`报价单未确认，当前状态: ${quote.status}`);
      }

      const existingOrder = (await databaseService.findMany('order')).find((o: any) => o.demandId === demandId);

      if (existingOrder) {
        throw new Error('该需求已存在订单');
      }

      const orderNumber = await this.generateOrderNumber();

      // 模拟事务操作
      const order = await databaseService.create('order', {
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
      });

      // 只有在使用真实数据库时才创建orderStatusHistory
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('orderStatusHistory', {
          orderId: order.id,
          newStatus: 'DEMAND_SUBMITTED' as OrderStatus,
          actorId: customerId,
          actorRole: 'CUSTOMER' as UserRole,
          reason: '订单创建'
        });
      }

      await databaseService.update('demand', { id: demandId }, { status: 'CONVERTED_TO_ORDER' as any });

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
          totalAmount: order.totalAmount
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
      const order = await databaseService.findUnique('order', { id: orderId });

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

      // 模拟事务操作
      const updatedOrder = await databaseService.update('order', { id: orderId }, {
        status: 'CONTRACT_SIGNED' as OrderStatus,
        contractSignedAt: new Date()
      });

      // 只有在使用真实数据库时才创建orderStatusHistory
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('orderStatusHistory', {
          orderId,
          previousStatus: order.status,
          newStatus: 'CONTRACT_SIGNED' as OrderStatus,
          actorId: customerId,
          actorRole: 'CUSTOMER' as UserRole,
          reason: '签约成功'
        });
      }

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
      const order = await databaseService.findUnique('order', { id: orderId });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (amount <= 0) {
        throw new Error('支付金额必须大于0');
      }

      const paymentNumber = await this.generatePaymentNumber();

      // 只有在使用真实数据库时才创建payment
      let payment: any = null;
      if (!databaseService.isUsingMockData()) {
        payment = await databaseService.create('payment', {
          orderId,
          paymentNumber,
          amount,
          paymentMethod,
          paymentStatus: 'COMPLETED',
          transactionId,
          paidAt: new Date()
        });
      }

      const newPaidAmount = order.paidAmount + amount;
      const newOutstandingAmount = order.totalAmount - newPaidAmount;

      const updatedOrder = await databaseService.update('order', { id: orderId }, {
        paidAmount: newPaidAmount,
        outstandingAmount: Math.max(0, newOutstandingAmount),
        paymentReceivedAt: newPaidAmount >= order.totalAmount ? new Date() : order.paymentReceivedAt,
        status: newPaidAmount >= order.totalAmount ? 'PAYMENT_RECEIVED' as OrderStatus : order.status
      });

      if (newPaidAmount >= order.totalAmount) {
        // 只有在使用真实数据库时才创建orderStatusHistory
        if (!databaseService.isUsingMockData()) {
          await databaseService.create('orderStatusHistory', {
            orderId,
            previousStatus: order.status,
            newStatus: 'PAYMENT_RECEIVED' as OrderStatus,
            actorId: paidBy,
            actorRole: paidByRole,
            reason: '全款支付完成'
          });
        }
      }

      await auditService.createLog({
        entityType: 'Order',
        entityId: orderId,
        action: 'PAYMENT_RECEIVED',
        actorId: paidBy,
        actorRole: paidByRole,
        previousState: {
          paidAmount: order.paidAmount,
          outstandingAmount: order.outstandingAmount
        },
        newState: {
          paidAmount: updatedOrder.paidAmount,
          outstandingAmount: updatedOrder.outstandingAmount
        },
        reason: '收到付款',
        metadata: {
          amount,
          paymentMethod,
          paymentNumber: payment ? payment.paymentNumber : null
        }
      });

      logger.info(`[OrderService] 支付记录成功: orderId=${orderId}, amount=${amount}`);

      return { payment, order: updatedOrder };
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
      const order = await databaseService.findUnique('order', { id: orderId });

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

      // 模拟事务操作
      const updatedOrder = await databaseService.update('order', { id: orderId }, {
        status: targetStatus,
        completedAt: targetStatus === 'COMPLETED' ? new Date() : order.completedAt
      });

      // 只有在使用真实数据库时才创建orderStatusHistory
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('orderStatusHistory', {
          orderId,
          previousStatus: order.status,
          newStatus: targetStatus,
          actorId,
          actorRole,
          reason,
          metadata: data
        });
      }

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
    const order = await databaseService.findUnique('order', { id: orderId });
    if (!order) return null;
    
    // 模拟关联数据
    const customer = await databaseService.findUnique('user', { id: order.customerId });
    const demand = await databaseService.findUnique('demand', { id: order.demandId });
    const designer = demand ? await databaseService.findUnique('user', { id: demand.designerId }) : null;
    const quote = await databaseService.findUnique('quote', { id: order.quoteId });
    const split = (await databaseService.findMany('split')).find((s: any) => s.orderId === orderId);
    const productionTasks = (await databaseService.findMany('productionTask')).filter((pt: any) => pt.orderId === orderId);
    const installations = (await databaseService.findMany('installation')).filter((i: any) => i.orderId === orderId);
    
    // 只有在使用真实数据库时才查询orderStatusHistory和payment
    let orderStatusHistory: any[] = [];
    let payments: any[] = [];
    if (!databaseService.isUsingMockData()) {
      orderStatusHistory = (await databaseService.findMany('orderStatusHistory')).filter((h: any) => h.orderId === orderId).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      payments = (await databaseService.findMany('payment')).filter((p: any) => p.orderId === orderId).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    // 为安装任务添加安装师傅信息
    const installationsWithInstaller = await Promise.all(installations.map(async (installation: any) => {
      const installer = await databaseService.findUnique('user', { id: installation.installerId });
      return {
        ...installation,
        installer: installer ? { id: installer.id, name: installer.name, phone: installer.phone } : null
      };
    }));
    
    return {
      ...order,
      customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null,
      demand: demand ? {
        ...demand,
        designer: designer ? { id: designer.id, name: designer.name, phone: designer.phone } : null
      } : null,
      quote,
      split,
      productionTasks,
      installations: installationsWithInstaller,
      orderStatusHistory,
      payments
    };
  }

  async getOrdersByCustomer(customerId: string): Promise<any[]> {
    const orders = await databaseService.findMany('order');
    const customerOrders = orders.filter((o: any) => o.customerId === customerId);
    
    // 按创建时间倒序排序
    customerOrders.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(customerOrders.map(async (order: any) => {
      const quote = await databaseService.findUnique('quote', { id: order.quoteId });
      
      // 只有在使用真实数据库时才查询orderStatusHistory
      let orderStatusHistory: any[] = [];
      if (!databaseService.isUsingMockData()) {
        orderStatusHistory = (await databaseService.findMany('orderStatusHistory')).filter((h: any) => h.orderId === order.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      const latestStatus = orderStatusHistory[0];
      
      return {
        ...order,
        quote: quote ? { id: quote.id, quoteNumber: quote.quoteNumber } : null,
        orderStatusHistory: latestStatus ? [latestStatus] : []
      };
    }));
  }

  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    // 只有在使用真实数据库时才查询orderStatusHistory
    if (databaseService.isUsingMockData()) {
      return [];
    }
    
    const history = (await databaseService.findMany('orderStatusHistory')).filter((h: any) => h.orderId === orderId);
    // 按创建时间正序排序
    return history.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const orders = await databaseService.findMany('order');
    const todayOrders = orders.filter((o: any) => {
      const oDate = new Date(o.createdAt);
      return oDate.getFullYear() === now.getFullYear() &&
        oDate.getMonth() === now.getMonth() &&
        oDate.getDate() === now.getDate();
    });

    const count = todayOrders.length;
    const sequence = (count + 1).toString().padStart(4, '0');
    return `OD${dateStr}${sequence}`;
  }

  private async generatePaymentNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const payments = await databaseService.findMany('payment');
    const todayPayments = payments.filter((p: any) => {
      const pDate = new Date(p.createdAt);
      return pDate.getFullYear() === now.getFullYear() &&
        pDate.getMonth() === now.getMonth() &&
        pDate.getDate() === now.getDate();
    });

    const count = todayPayments.length;
    const sequence = (count + 1).toString().padStart(4, '0');
    return `PY${dateStr}${sequence}`;
  }
}

export const orderService = new OrderService();
export default OrderService;
