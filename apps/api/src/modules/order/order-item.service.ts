import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderItem, OrderStatus } from '@pet/db';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../redis/cache.service';
import { calculateOffset, buildPaginationResult, generateCacheKey } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import { UpdateOrderItemDto, OrderItemQueryDto } from './dto';

const ORDER_ITEM_CACHE_PREFIX = 'order:item:';
const CACHE_TTL = 30 * 60;

@Injectable()
export class OrderItemService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cacheService: CacheService,
  ) {}

  async findById(id: string): Promise<OrderItem & { attributes: Record<string, string> }> {
    const cacheKey = generateCacheKey(ORDER_ITEM_CACHE_PREFIX, id);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const item = await this.prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: true,
        sku: true,
        spu: true,
        review: true,
      },
    });
    if (!item) {
      throw new NotFoundException('订单项不存在');
    }

    const result = {
      ...item,
      attributes: item.attributes as unknown as Record<string, string>,
    };

    await this.cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findByOrderId(orderId: string): Promise<Array<OrderItem & { attributes: Record<string, string> }>> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: {
        sku: true,
        spu: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return items.map(item => ({
      ...item,
      attributes: item.attributes as unknown as Record<string, string>,
    }));
  }

  async findPaginated(query: OrderItemQueryDto): Promise<PaginationResult<OrderItem & { attributes: Record<string, string> }>> {
    const where: Record<string, unknown> = {};

    if (query.orderId) {
      where.orderId = query.orderId;
    }
    if (query.skuId) {
      where.skuId = query.skuId;
    }

    const [total, items] = await Promise.all([
      this.prisma.orderItem.count({ where }),
      this.prisma.orderItem.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        include: {
          sku: true,
          spu: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const transformedItems = items.map(item => ({
      ...item,
      attributes: item.attributes as unknown as Record<string, string>,
    }));

    return buildPaginationResult(transformedItems, total, query.page, query.pageSize);
  }

  async update(id: string, dto: UpdateOrderItemDto): Promise<OrderItem> {
    const item = await this.prisma.orderItem.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!item) {
      throw new NotFoundException('订单项不存在');
    }

    if (item.order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('订单已确认，无法修改订单项');
    }

    const updated = await this.prisma.orderItem.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        subtotal: dto.quantity ? Number(item.price) * dto.quantity : undefined,
      },
    });

    await this.clearCache(id);
    return updated;
  }

  async markAsReviewed(id: string): Promise<OrderItem> {
    const updated = await this.prisma.orderItem.update({
      where: { id },
      data: { isReviewed: true },
    });
    await this.clearCache(id);
    return updated;
  }

  private async clearCache(id: string): Promise<void> {
    await this.cacheService.del(generateCacheKey(ORDER_ITEM_CACHE_PREFIX, id));
  }
}
