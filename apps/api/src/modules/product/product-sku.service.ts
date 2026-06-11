import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductSKU, Prisma } from '@pet/db';
import type { JsonValue } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../redis/cache.service';
import { RedisService } from '../redis/redis.service';
import { generateCacheKey, calculateOffset, buildPaginationResult } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import { CreateProductSkuDto, UpdateProductSkuDto, UpdateStockDto } from './dto';

const SKU_CACHE_PREFIX = 'product:sku:';
const SKU_STOCK_LOCK_PREFIX = 'product:sku:stock:lock:';
const CACHE_TTL = 60 * 60;
const STOCK_LOCK_TTL = 15 * 60;

@Injectable()
export class ProductSkuService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateProductSkuDto): Promise<ProductSKU> {
    const spu = await this.prisma.productSPU.findUnique({
      where: { id: dto.spuId },
    });
    if (!spu) {
      throw new NotFoundException('SPU不存在');
    }

    const existing = await this.prisma.productSKU.findUnique({
      where: { skuCode: dto.skuCode },
    });
    if (existing) {
      throw new ConflictException('SKU编码已存在');
    }

    const sku = await this.prisma.productSKU.create({
      data: {
        ...dto,
        attributes: dto.attributes as unknown as Prisma.JsonValue,
      },
    });

    await this.clearCache(sku.id);
    return sku;
  }

  async update(id: string, dto: UpdateProductSkuDto): Promise<ProductSKU> {
    const sku = await this.prisma.productSKU.findUnique({
      where: { id },
    });
    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    if (dto.skuCode && dto.skuCode !== sku.skuCode) {
      const existing = await this.prisma.productSKU.findUnique({
        where: { skuCode: dto.skuCode },
      });
      if (existing) {
        throw new ConflictException('SKU编码已存在');
      }
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.attributes) {
      updateData.attributes = dto.attributes as unknown as JsonValue;
    }

    const updated = await this.prisma.productSKU.update({
      where: { id },
      data: updateData,
    });

    await this.clearCache(id);
    return updated;
  }

  async updateStock(id: string, dto: UpdateStockDto): Promise<ProductSKU> {
    const sku = await this.prisma.productSKU.findUnique({
      where: { id },
    });
    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    const updated = await this.prisma.productSKU.update({
      where: { id },
      data: { stock: dto.stock },
    });

    await this.clearCache(id);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const sku = await this.prisma.productSKU.findUnique({
      where: { id },
    });
    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    await this.prisma.productSKU.delete({ where: { id } });
    await this.clearCache(id);
  }

  async findById(id: string): Promise<ProductSKU & { attributes: Record<string, string> }> {
    const cacheKey = generateCacheKey(SKU_CACHE_PREFIX, id);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const sku = await this.prisma.productSKU.findUnique({
      where: { id },
      include: { spu: true },
    });
    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    const result = {
      ...sku,
      attributes: sku.attributes as unknown as Record<string, string>,
    };

    await this.cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findBySpuId(spuId: string): Promise<Array<ProductSKU & { attributes: Record<string, string> }>> {
    const skus = await this.prisma.productSKU.findMany({
      where: { spuId },
      orderBy: { createdAt: 'asc' },
    });

    return skus.map(sku => ({
      ...sku,
      attributes: sku.attributes as unknown as Record<string, string>,
    }));
  }

  async findPaginated(page: number, pageSize: number, spuId?: string): Promise<PaginationResult<ProductSKU>> {
    const where: Record<string, unknown> = {};
    if (spuId) {
      where.spuId = spuId;
    }

    const [total, items] = await Promise.all([
      this.prisma.productSKU.count({ where }),
      this.prisma.productSKU.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const transformedItems = items.map(item => ({
      ...item,
      attributes: item.attributes as unknown as Record<string, string>,
    }));

    return buildPaginationResult(transformedItems, total, page, pageSize);
  }

  async lockStock(items: Array<{ skuId: string; quantity: number }>, orderId: string): Promise<boolean> {
    const script = `
      for i = 1, #KEYS, 2 do
        local skuId = KEYS[i]
        local quantity = tonumber(KEYS[i+1])
        local stockKey = 'product:sku:stock:' .. skuId
        local lockKey = 'product:sku:stock:lock:' .. skuId .. ':' .. ARGV[1]
        
        local stock = tonumber(redis.call('get', stockKey) or -1)
        if stock == -1 then
          return {error = 'STOCK_NOT_INITIALIZED', skuId = skuId}
        end
        
        if stock < quantity then
          return {error = 'INSUFFICIENT_STOCK', skuId = skuId, stock = stock}
        end
        
        redis.call('decrby', stockKey, quantity)
        redis.call('incrby', lockKey, quantity)
        redis.call('expire', lockKey, tonumber(ARGV[2]))
      end
      return {success = true}
    `;

    const stockKeys: string[] = [];
    for (const item of items) {
      const stockKey = `product:sku:stock:${item.skuId}`;
      const stockExists = await this.cacheService.exists(stockKey);
      if (!stockExists) {
        const sku = await this.findById(item.skuId);
        await this.cacheService.set(stockKey, String(sku.stock - sku.stockLocked));
      }
      stockKeys.push(item.skuId, String(item.quantity));
    }

    const result = await this.redisService.getClient().eval(script, stockKeys, [orderId, STOCK_LOCK_TTL]) as Record<string, unknown>;
    if (result.error) {
      throw new BadRequestException(`库存不足: ${result.skuId}`);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.productSKU.update({
          where: { id: item.skuId },
          data: {
            stock: { decrement: item.quantity },
            stockLocked: { increment: item.quantity },
          },
        });
      }
    });

    return true;
  }

  async unlockStock(items: Array<{ skuId: string; quantity: number }>, orderId: string): Promise<boolean> {
    const script = `
      for i = 1, #KEYS, 2 do
        local skuId = KEYS[i]
        local quantity = tonumber(KEYS[i+1])
        local stockKey = 'product:sku:stock:' .. skuId
        local lockKey = 'product:sku:stock:lock:' .. skuId .. ':' .. ARGV[1]
        
        local locked = tonumber(redis.call('get', lockKey) or 0)
        if locked >= quantity then
          redis.call('incrby', stockKey, quantity)
          redis.call('decrby', lockKey, quantity)
          if tonumber(redis.call('get', lockKey)) <= 0 then
            redis.call('del', lockKey)
          end
        end
      end
      return {success = true}
    `;

    const keys: string[] = [];
    for (const item of items) {
      keys.push(item.skuId, String(item.quantity));
    }

    await this.redisService.getClient().eval(script, keys, [orderId]);

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.productSKU.update({
          where: { id: item.skuId },
          data: {
            stock: { increment: item.quantity },
            stockLocked: { decrement: item.quantity },
          },
        });
      }
    });

    return true;
  }

  async deductStock(items: Array<{ skuId: string; quantity: number }>, orderId: string): Promise<boolean> {
    const script = `
      for i = 1, #KEYS, 2 do
        local skuId = KEYS[i]
        local quantity = tonumber(KEYS[i+1])
        local lockKey = 'product:sku:stock:lock:' .. skuId .. ':' .. ARGV[1]
        
        local locked = tonumber(redis.call('get', lockKey) or 0)
        if locked < quantity then
          return {error = 'INSUFFICIENT_LOCK', skuId = skuId, locked = locked}
        end
        
        redis.call('decrby', lockKey, quantity)
        if tonumber(redis.call('get', lockKey)) <= 0 then
          redis.call('del', lockKey)
        end
      end
      return {success = true}
    `;

    const keys: string[] = [];
    for (const item of items) {
      keys.push(item.skuId, String(item.quantity));
    }

    const result = await this.redisService.getClient().eval(script, keys, [orderId]) as Record<string, unknown>;
    if (result.error) {
      throw new BadRequestException(`锁定库存不足: ${result.skuId}`);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.productSKU.update({
          where: { id: item.skuId },
          data: {
            stockLocked: { decrement: item.quantity },
          },
        });
      }
    });

    return true;
  }

  async checkStock(skuId: string, quantity: number): Promise<{ available: boolean; stock: number; stockLocked: number }> {
    const sku = await this.findById(skuId);
    const availableStock = sku.stock - sku.stockLocked;
    return {
      available: availableStock >= quantity,
      stock: sku.stock,
      stockLocked: sku.stockLocked,
    };
  }

  private async clearCache(id?: string): Promise<void> {
    if (id) {
      await this.cacheService.del(generateCacheKey(SKU_CACHE_PREFIX, id));
      await this.cacheService.del(`product:sku:stock:${id}`);
    } else {
      const keys = await this.redisService.getClient().keys(`${SKU_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
      const stockKeys = await this.redisService.getClient().keys('product:sku:stock:*');
      if (stockKeys.length > 0) {
        await this.redisService.getClient().del(...stockKeys);
      }
    }
  }
}
