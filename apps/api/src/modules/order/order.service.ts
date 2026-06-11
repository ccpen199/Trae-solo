import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Order, OrderStatus, PaymentStatus, ShippingStatus, UserCoupon, User } from '@pet/db';
import type { JsonValue } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../redis/cache.service';
import { RedisService } from '../redis/redis.service';
import { ProductSkuService } from '../product/product-sku.service';
import { ProductSpuService } from '../product/product-spu.service';
import { generateOrderNo, calculateOffset, buildPaginationResult, generateCacheKey } from '@pet/shared/utils';
import { POINT_VALUE_RATIO, MEMBERSHIP_BENEFITS } from '@pet/shared/constants';
import { OrderStatus as OrderStatusEnum, MembershipLevel } from '@pet/shared/enums';
import type { PaginationResult, OrderAddress, InvoiceInfo, OrderItem, Order as OrderType } from '@pet/shared/types';
import { CreateOrderDto, OrderQueryDto, CancelOrderDto } from './dto';

const ORDER_CACHE_PREFIX = 'order:';
const CACHE_TTL = 30 * 60;

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
    private readonly skuService: ProductSkuService,
    private readonly spuService: ProductSpuService,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const skuIds = dto.items.map(item => item.skuId);
    const skus = await Promise.all(
      skuIds.map(skuId => this.skuService.findById(skuId)),
    );

    const skuMap = new Map(skus.map(sku => [sku.id, sku]));
    for (const item of dto.items) {
      const sku = skuMap.get(item.skuId);
      if (!sku) {
        throw new NotFoundException(`SKU不存在: ${item.skuId}`);
      }
      if (!sku.status) {
        throw new BadRequestException(`商品已下架: ${item.skuId}`);
      }
      const stockCheck = await this.skuService.checkStock(item.skuId, item.quantity);
      if (!stockCheck.available) {
        throw new BadRequestException(`库存不足: ${item.skuId}`);
      }
    }

    let couponDiscount = 0;
    let userCoupon: UserCoupon | null = null;
    if (dto.couponId) {
      userCoupon = await this.prisma.userCoupon.findUnique({
        where: { id: dto.couponId },
        include: { template: true },
      });
      if (!userCoupon || userCoupon.userId !== dto.userId) {
        throw new NotFoundException('优惠券不存在');
      }
      if (userCoupon.status !== 'unused') {
        throw new BadRequestException('优惠券已使用或已过期');
      }
      couponDiscount = Number(userCoupon.template.value);
    }

    const pointDiscount = dto.pointUsed ? dto.pointUsed / POINT_VALUE_RATIO : 0;
    if (pointDiscount > 0 && user.point < dto.pointUsed) {
      throw new BadRequestException('积分不足');
    }

    const merchantId = dto.merchantId || skus[0].spu.merchantId;

    let totalAmount = 0;
    const orderItems: Array<{
      skuId: string;
      spuId: string;
      productName: string;
      productImage: string;
      attributes: JsonValue;
      price: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of dto.items) {
      const sku = skuMap.get(item.skuId)!;
      const price = Number(sku.price);
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        skuId: sku.id,
        spuId: sku.spuId,
        productName: sku.spu.name,
        productImage: sku.image || sku.spu.mainImage,
        attributes: sku.attributes as unknown as JsonValue,
        price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const membershipBenefit = MEMBERSHIP_BENEFITS[user.membershipLevel as MembershipLevel];
    const membershipDiscount = totalAmount * (1 - membershipBenefit.discountRate);

    let discountAmount = couponDiscount + pointDiscount + membershipDiscount;
    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    let shippingFee = 0;
    const actualAmount = totalAmount - discountAmount + shippingFee;

    if (actualAmount < 0) {
      throw new BadRequestException('订单金额异常');
    }

    const pointEarned = Math.floor(actualAmount * membershipBenefit.pointMultiplier);

    const orderNo = generateOrderNo();

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo,
          userId: dto.userId,
          merchantId,
          status: OrderStatus.PENDING_PAYMENT,
          totalAmount,
          discountAmount,
          shippingFee,
          actualAmount,
          pointUsed: dto.pointUsed,
          pointEarned,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          shippingStatus: ShippingStatus.PENDING,
          shippingAddress: dto.shippingAddress as unknown as JsonValue,
          invoiceInfo: dto.invoiceInfo as unknown as JsonValue,
          remark: dto.remark,
          couponId: dto.couponId,
        },
      });

      await Promise.all(
        orderItems.map(item =>
          tx.orderItem.create({
            data: {
              ...item,
              orderId: order.id,
            },
          }),
        ),
      );

      if (dto.pointUsed && dto.pointUsed > 0) {
        await tx.user.update({
          where: { id: dto.userId },
          data: { point: { decrement: dto.pointUsed } },
        });
      }

      if (userCoupon) {
        await tx.userCoupon.update({
          where: { id: dto.couponId },
          data: {
            status: 'frozen',
            orderId: order.id,
          },
        });
      }

      const lockItems = dto.items.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity,
      }));
      await this.skuService.lockStock(lockItems, order.id);

      return order;
    });

    const orderWithItems = await this.findById(result.id);
    await this.clearCache(dto.userId);

    return orderWithItems;
  }

  async findById(id: string): Promise<Order & { items: OrderItem[] }> {
    const cacheKey = generateCacheKey(ORDER_CACHE_PREFIX, id);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
        merchant: true,
        couponUsed: true,
      },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const result = {
      ...order,
      shippingAddress: order.shippingAddress as unknown as OrderAddress,
      invoiceInfo: order.invoiceInfo as unknown as InvoiceInfo,
      items: order.items.map(item => ({
        ...item,
        attributes: item.attributes as unknown as Record<string, string>,
      })),
    };

    await this.cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findPaginated(query: OrderQueryDto): Promise<PaginationResult<Order & { items: OrderItem[] }>> {
    const where: Record<string, unknown> = {};

    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.merchantId) {
      where.merchantId = query.merchantId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.orderNo) {
      where.orderNo = { contains: query.orderNo };
    }

    const [total, items] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const transformedItems = items.map(order => ({
      ...order,
      shippingAddress: order.shippingAddress as unknown as OrderAddress,
      items: order.items.map(item => ({
        ...item,
        attributes: item.attributes as unknown as Record<string, string>,
      })),
    }));

    return buildPaginationResult(transformedItems, total, query.page, query.pageSize);
  }

  async cancel(dto: CancelOrderDto, userId: string): Promise<Order> {
    const order = await this.findById(dto.orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException('无权限取消该订单');
    }

    const allowedStatuses = [OrderStatusEnum.PENDING_PAYMENT, OrderStatusEnum.PENDING_CONFIRM];
    if (!allowedStatuses.includes(order.status as OrderStatusEnum)) {
      throw new BadRequestException('该状态下无法取消订单');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: dto.orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: dto.cancelReason,
        },
      });

      if (order.pointUsed > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { point: { increment: order.pointUsed } },
        });
      }

      if (order.couponId) {
        await tx.userCoupon.update({
          where: { id: order.couponId },
          data: {
            status: 'unused',
            orderId: null,
          },
        });
      }

      const unlockItems = order.items.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity,
      }));
      await this.skuService.unlockStock(unlockItems, order.id);

      return updatedOrder;
    });

    await this.clearCache(userId, dto.orderId);
    return result;
  }

  async confirmReceive(orderId: string, userId: string): Promise<Order> {
    const order = await this.findById(orderId);
    if (order.userId !== userId) {
      throw new ForbiddenException('无权限操作该订单');
    }

    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('该状态下无法确认收货');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
          deliveredAt: order.status === OrderStatus.SHIPPED ? new Date() : order.deliveredAt,
        },
      });

      const deductItems = order.items.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity,
      }));
      await this.skuService.deductStock(deductItems, order.id);

      for (const item of order.items) {
        await this.spuService.incrementSalesCount(item.spuId, item.quantity);
      }

      await tx.user.update({
        where: { id: order.userId },
        data: {
          point: { increment: order.pointEarned },
          growthPoints: { increment: Math.floor(order.actualAmount) },
        },
      });

      if (order.couponId) {
        await tx.userCoupon.update({
          where: { id: order.couponId },
          data: {
            status: 'used',
            usedAt: new Date(),
          },
        });
      }

      return updatedOrder;
    });

    await this.clearCache(userId, orderId);
    return result;
  }

  async updateStatus(orderId: string, status: OrderStatus, operatorId?: string): Promise<Order> {
    const order = await this.findById(orderId);

    if (!this.isValidStatusTransition(order.status as OrderStatusEnum, status as OrderStatusEnum)) {
      throw new BadRequestException('无效的订单状态转换');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    await this.clearCache(order.userId, orderId);
    return updated;
  }

  private isValidStatusTransition(current: OrderStatusEnum, next: OrderStatusEnum): boolean {
    const transitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
      [OrderStatusEnum.PENDING_PAYMENT]: [OrderStatusEnum.PENDING_CONFIRM, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.PENDING_CONFIRM]: [OrderStatusEnum.PENDING_SHIPMENT, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.PENDING_SHIPMENT]: [OrderStatusEnum.SHIPPED, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED],
      [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.COMPLETED, OrderStatusEnum.REFUNDING],
      [OrderStatusEnum.COMPLETED]: [OrderStatusEnum.REFUNDING],
      [OrderStatusEnum.CANCELLED]: [],
      [OrderStatusEnum.REFUNDING]: [OrderStatusEnum.REFUNDED, OrderStatusEnum.COMPLETED],
      [OrderStatusEnum.REFUNDED]: [],
    };

    return transitions[current]?.includes(next) || false;
  }

  private async clearCache(userId: string, orderId?: string): Promise<void> {
    if (orderId) {
      await this.cacheService.del(generateCacheKey(ORDER_CACHE_PREFIX, orderId));
    }
    const keys = await this.redisService.getClient().keys(`${ORDER_CACHE_PREFIX}user:${userId}:*`);
    if (keys.length > 0) {
      await this.redisService.getClient().del(...keys);
    }
  }
}
