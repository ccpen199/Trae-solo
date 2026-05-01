import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../database/dataSource';
import { OrderEntity, CouponInstanceEntity } from '../entities';
import { Order, CouponStatus, AuditAction, UserRole } from '../types';
import { promotionStackingEngine } from '../engines/promotionStackingEngine';
import { couponStateMachine } from '../engines/couponStateEngine';
import { budgetGuardEngine } from '../engines/budgetGuardEngine';
import { auditService } from './auditService';
import { couponService } from './couponService';

export interface CreateOrderOptions {
  userId: string;
  storeId: string;
  originalAmount: number;
  productItems: Array<{
    productId: string;
    productName: string;
    categoryId?: string;
    price: number;
    quantity: number;
  }>;
  couponIds?: string[];
  ipAddress?: string;
  traceId: string;
}

export interface OrderResult {
  success: boolean;
  order?: Order;
  discountAmount?: number;
  finalAmount?: number;
  appliedCoupons?: string[];
  errors?: string[];
}

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  async calculateBestDiscount(
    userId: string,
    orderAmount: number,
    storeId?: string,
    productCategories?: string[]
  ): Promise<{
    bestOption: {
      coupons: string[];
      totalDiscount: number;
      finalAmount: number;
    } | null;
    allOptions: Array<{
      coupons: string[];
      totalDiscount: number;
      finalAmount: number;
      isValid: boolean;
    }>;
  }> {
    const availableCoupons = await couponService.getAvailableCouponsForOrder(userId, orderAmount, storeId);
    
    if (availableCoupons.length === 0) {
      return {
        bestOption: null,
        allOptions: []
      };
    }
    
    const stackingResult = await promotionStackingEngine.calculateBestOption({
      orderAmount,
      userId,
      storeId,
      productCategories,
      availableCoupons,
      traceId: uuidv4()
    });
    
    return {
      bestOption: stackingResult.bestOption ? {
        coupons: stackingResult.bestOption.coupons.map(c => c.id),
        totalDiscount: stackingResult.bestOption.totalDiscount,
        finalAmount: stackingResult.bestOption.finalAmount
      } : null,
      allOptions: stackingResult.allOptions.map(o => ({
        coupons: o.coupons.map(c => c.id),
        totalDiscount: o.totalDiscount,
        finalAmount: o.finalAmount,
        isValid: o.isValid
      }))
    };
  }

  async createOrder(options: CreateOrderOptions): Promise<OrderResult> {
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const couponRepository = AppDataSource.getRepository(CouponInstanceEntity);
    
    let discountAmount = 0;
    let appliedCoupons: string[] = [];
    const errors: string[] = [];
    
    if (options.couponIds && options.couponIds.length > 0) {
      const validCoupons = await couponRepository.findByIds(options.couponIds);
      
      for (const couponId of options.couponIds) {
        const coupon = validCoupons.find(c => c.id === couponId);
        if (!coupon) {
          errors.push(`Coupon ${couponId} not found`);
          continue;
        }
        
        if (coupon.userId !== options.userId) {
          errors.push(`Coupon ${couponId} does not belong to user`);
          continue;
        }
        
        if (coupon.status !== CouponStatus.PENDING_USE) {
          errors.push(`Coupon ${couponId} is not available for use`);
          continue;
        }
        
        if (coupon.minOrderAmount > options.originalAmount) {
          errors.push(`Coupon ${couponId} requires minimum order amount ${coupon.minOrderAmount}`);
          continue;
        }
        
        appliedCoupons.push(couponId);
      }
      
      if (appliedCoupons.length > 0) {
        const stackedCoupons = validCoupons.filter(c => appliedCoupons.includes(c.id));
        const stackResult = await promotionStackingEngine.calculateBestOption({
          orderAmount: options.originalAmount,
          userId: options.userId,
          storeId: options.storeId,
          availableCoupons: stackedCoupons,
          traceId: options.traceId
        });
        
        if (stackResult.bestOption) {
          discountAmount = stackResult.bestOption.totalDiscount;
        }
      }
    }
    
    const finalAmount = Math.max(0, options.originalAmount - discountAmount);
    
    const orderNo = this.generateOrderNo();
    
    const order = orderRepository.create({
      orderNo,
      userId: options.userId,
      storeId: options.storeId,
      originalAmount: options.originalAmount,
      discountAmount,
      finalAmount,
      appliedCoupons,
      status: 'pending'
    });
    
    await orderRepository.save(order);
    
    await auditService.log({
      action: AuditAction.COUPON_USE,
      userId: options.userId,
      userRole: 'customer' as any,
      resourceType: 'order',
      resourceId: order.id,
      details: {
        orderNo,
        originalAmount: options.originalAmount,
        discountAmount,
        finalAmount,
        appliedCoupons,
        productItems: options.productItems
      },
      ipAddress: options.ipAddress,
      traceId: options.traceId
    });
    
    return {
      success: true,
      order: this.toOrderDto(order),
      discountAmount,
      finalAmount,
      appliedCoupons,
      errors
    };
  }

  async confirmPayment(orderId: string, userId: string, traceId: string): Promise<{
    success: boolean;
    order?: Order;
    errors?: string[];
  }> {
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const couponRepository = AppDataSource.getRepository(CouponInstanceEntity);
    
    const order = await orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      return { success: false, errors: ['Order not found'] };
    }
    
    if (order.userId !== userId) {
      return { success: false, errors: ['Order does not belong to user'] };
    }
    
    if (order.status !== 'pending') {
      return { success: false, errors: [`Order is already ${order.status}`] };
    }
    
    const errors: string[] = [];
    
    if (order.appliedCoupons && order.appliedCoupons.length > 0) {
      for (const couponId of order.appliedCoupons) {
        const coupon = await couponRepository.findOne({ where: { id: couponId } });
        
        if (!coupon) {
          errors.push(`Coupon ${couponId} not found`);
          continue;
        }
        
        const transitionResult = await couponStateMachine.transition(
          couponId,
          coupon.status,
          'use',
          userId,
          'customer' as any
        );
        
        if (!transitionResult.success) {
          errors.push(`Failed to use coupon ${couponId}: ${transitionResult.error}`);
          continue;
        }
        
        coupon.status = transitionResult.newStatus!;
        coupon.orderId = orderId;
        coupon.usedAt = new Date();
        coupon.actualDiscountAmount = coupon.value;
        coupon.updatedAt = new Date();
        
        await couponRepository.save(coupon);
      }
    }
    
    order.status = 'paid';
    order.paidAt = new Date();
    order.updatedAt = new Date();
    
    await orderRepository.save(order);
    
    await auditService.log({
      action: AuditAction.COUPON_USE,
      userId,
      userRole: 'customer' as any,
      resourceType: 'order',
      resourceId: orderId,
      details: {
        orderNo: order.orderNo,
        status: 'paid',
        appliedCoupons: order.appliedCoupons
      },
      traceId
    });
    
    return {
      success: errors.length === 0,
      order: this.toOrderDto(order),
      errors
    };
  }

  async processRefund(
    orderId: string,
    userId: string,
    userRole: UserRole,
    refundStrategy: 'full' | 'partial' | 'none' = 'full',
    traceId: string
  ): Promise<{
    success: boolean;
    order?: Order;
    refundedCoupons: string[];
    errors?: string[];
  }> {
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const couponRepository = AppDataSource.getRepository(CouponInstanceEntity);
    
    const order = await orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      return { success: false, refundedCoupons: [], errors: ['Order not found'] };
    }
    
    if (order.status === 'refunded' || order.status === 'cancelled') {
      return { success: false, refundedCoupons: [], errors: [`Order is already ${order.status}`] };
    }
    
    const errors: string[] = [];
    const refundedCoupons: string[] = [];
    
    if (refundStrategy !== 'none' && order.appliedCoupons && order.appliedCoupons.length > 0) {
      for (const couponId of order.appliedCoupons) {
        const coupon = await couponRepository.findOne({ where: { id: couponId } });
        
        if (!coupon) {
          errors.push(`Coupon ${couponId} not found`);
          continue;
        }
        
        if (coupon.status !== CouponStatus.USED) {
          errors.push(`Coupon ${couponId} is not in used state`);
          continue;
        }
        
        const transitionResult = await couponStateMachine.transition(
          couponId,
          coupon.status,
          'refund',
          userId,
          userRole
        );
        
        if (!transitionResult.success) {
          errors.push(`Failed to refund coupon ${couponId}: ${transitionResult.error}`);
          continue;
        }
        
        coupon.status = transitionResult.newStatus!;
        coupon.refundedAt = new Date();
        coupon.updatedAt = new Date();
        
        await couponRepository.save(coupon);
        refundedCoupons.push(couponId);
      }
    }
    
    order.status = 'refunded';
    order.refundedAt = new Date();
    order.updatedAt = new Date();
    
    await orderRepository.save(order);
    
    await auditService.log({
      action: AuditAction.COUPON_REFUND,
      userId,
      userRole,
      resourceType: 'order',
      resourceId: orderId,
      details: {
        orderNo: order.orderNo,
        refundStrategy,
        refundedCoupons
      },
      traceId
    });
    
    return {
      success: errors.length === 0,
      order: this.toOrderDto(order),
      refundedCoupons,
      errors
    };
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const order = await orderRepository.findOne({ where: { id: orderId } });
    
    if (!order) {
      return null;
    }
    
    return this.toOrderDto(order);
  }

  async listOrders(filters: {
    userId?: string;
    storeId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const queryBuilder = orderRepository.createQueryBuilder('order');
    
    if (filters.userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId: filters.userId });
    }
    
    if (filters.storeId) {
      queryBuilder.andWhere('order.storeId = :storeId', { storeId: filters.storeId });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }
    
    if (filters.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [orders, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data: orders.map(o => this.toOrderDto(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  private generateOrderNo(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${year}${month}${day}${random}`;
  }

  private toOrderDto(order: OrderEntity): Order {
    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      storeId: order.storeId,
      originalAmount: order.originalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      appliedCoupons: order.appliedCoupons || [],
      status: order.status as any,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
      refundedAt: order.refundedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

export const orderService = OrderService.getInstance();
