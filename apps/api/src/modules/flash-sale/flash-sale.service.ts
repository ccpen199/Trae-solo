import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FlashSale, FlashSaleItem, FlashSaleStatus } from '@pet/db';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../redis/cache.service';
import { RedisService } from '../redis/redis.service';
import { ProductSkuService } from '../product/product-sku.service';
import { generateCacheKey, calculateOffset, buildPaginationResult, generateUUID } from '@pet/shared/utils';
import { FLASH_SALE_STOCK_CACHE_PREFIX, FLASH_SALE_USER_LIMIT_PREFIX, FLASH_SALE_LOCK_PREFIX } from '@pet/shared/constants';
import type { PaginationResult, FlashSale as FlashSaleType, FlashSaleItem as FlashSaleItemType } from '@pet/shared/types';
import { CreateFlashSaleDto, UpdateFlashSaleDto, UpdateFlashSaleStatusDto, FlashSaleQueryDto, FlashSalePurchaseDto, FlashSaleItemQueryDto } from './dto';

const FLASH_SALE_CACHE_PREFIX = 'flash_sale:';
const CACHE_TTL = 5 * 60;
const LOCK_TTL = 10;

const DEDUCT_STOCK_LUA_SCRIPT = `
  local stockKey = KEYS[1]
  local userKey = KEYS[2]
  local lockKey = KEYS[3]
  local quantity = tonumber(ARGV[1])
  local limitPerUser = tonumber(ARGV[2])
  local userId = ARGV[3]
  local lockValue = ARGV[4]

  local locked = redis.call('set', lockKey, lockValue, 'NX', 'PX', 10000)
  if not locked then
    return {error = 'TOO_MANY_REQUESTS', message = '请求过于频繁，请稍后重试'}
  end

  local stock = tonumber(redis.call('get', stockKey) or -1)
  if stock == -1 then
    redis.call('del', lockKey)
    return {error = 'STOCK_NOT_INITIALIZED', message = '库存未初始化'}
  end

  if stock < quantity then
    redis.call('del', lockKey)
    return {error = 'INSUFFICIENT_STOCK', message = '库存不足', stock = stock}
  end

  local userPurchased = tonumber(redis.call('get', userKey) or 0)
  if userPurchased + quantity > limitPerUser then
    redis.call('del', lockKey)
    return {error = 'EXCEED_LIMIT', message = '超出每人限购数量', purchased = userPurchased, limit = limitPerUser}
  end

  redis.call('decrby', stockKey, quantity)
  redis.call('incrby', userKey, quantity)

  redis.call('del', lockKey)

  return {success = true, remainingStock = stock - quantity}
`;

const ROLLBACK_STOCK_LUA_SCRIPT = `
  local stockKey = KEYS[1]
  local userKey = KEYS[2]
  local quantity = tonumber(ARGV[1])

  local currentStock = tonumber(redis.call('get', stockKey) or 0)
  redis.call('incrby', stockKey, quantity)

  local userPurchased = tonumber(redis.call('get', userKey) or 0)
  if userPurchased >= quantity then
    redis.call('decrby', userKey, quantity)
  end

  return {success = true, remainingStock = currentStock + quantity}
`;

@Injectable()
export class FlashSaleService {
  constructor(
    @Inject('PRISMA_CLIENT') private readonly prisma: PrismaClient,
    private readonly redisService: RedisService,
    private readonly skuService: ProductSkuService,
  ) {}

  async create(dto: CreateFlashSaleDto): Promise<FlashSale & { items: FlashSaleItem[] }> {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    const totalStock = dto.items.reduce((sum, item) => sum + item.saleStock, 0);

    for (const item of dto.items) {
      const sku = await this.skuService.findById(item.skuId);
      if (!sku) {
        throw new NotFoundException(`SKU不存在: ${item.skuId}`);
      }
      const stockCheck = await this.skuService.checkStock(item.skuId, item.saleStock);
      if (!stockCheck.available) {
        throw new BadRequestException(`SKU库存不足: ${item.skuId}`);
      }
      if (item.salePrice >= item.originalPrice) {
        throw new BadRequestException(`秒杀价格必须低于原价: ${item.skuId}`);
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const flashSale = await tx.flashSale.create({
        data: {
          title: dto.title,
          description: dto.description,
          bannerImage: dto.bannerImage,
          startTime: dto.startTime,
          endTime: dto.endTime,
          status: FlashSaleStatus.DRAFT,
          totalStock,
          soldCount: 0,
        },
      });

      const items = await Promise.all(
        dto.items.map(item =>
          tx.flashSaleItem.create({
            data: {
              flashSaleId: flashSale.id,
              skuId: item.skuId,
              spuId: item.spuId,
              salePrice: item.salePrice,
              originalPrice: item.originalPrice,
              saleStock: item.saleStock,
              soldCount: 0,
              limitPerUser: item.limitPerUser,
              sortOrder: item.sortOrder,
            },
          }),
        ),
      );

      return { ...flashSale, items };
    });

    await this.clearCache();
    return result;
  }

  async update(id: string, dto: UpdateFlashSaleDto): Promise<FlashSale> {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!flashSale) {
      throw new NotFoundException('秒杀活动不存在');
    }

    if (flashSale.status === FlashSaleStatus.ACTIVE) {
      throw new BadRequestException('活动进行中，无法修改');
    }

    let totalStock = flashSale.totalStock;
    if (dto.items) {
      totalStock = dto.items.reduce((sum, item) => sum + item.saleStock, 0);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.flashSale.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          bannerImage: dto.bannerImage,
          startTime: dto.startTime,
          endTime: dto.endTime,
          totalStock,
        },
      });

      if (dto.items) {
        await tx.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
        await Promise.all(
          dto.items.map(item =>
            tx.flashSaleItem.create({
              data: {
                flashSaleId: id,
                skuId: item.skuId,
                spuId: item.spuId,
                salePrice: item.salePrice,
                originalPrice: item.originalPrice,
                saleStock: item.saleStock,
                soldCount: 0,
                limitPerUser: item.limitPerUser,
                sortOrder: item.sortOrder,
              },
            }),
          ),
        );
      }

      return updated;
    });

    await this.clearCache(id);
    return result;
  }

  async updateStatus(id: string, dto: UpdateFlashSaleStatusDto): Promise<FlashSale> {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!flashSale) {
      throw new NotFoundException('秒杀活动不存在');
    }

    if (dto.status === FlashSaleStatus.ACTIVE && flashSale.items.length === 0) {
      throw new BadRequestException('请先添加秒杀商品');
    }

    const updated = await this.prisma.flashSale.update({
      where: { id },
      data: { status: dto.status },
    });

    if (dto.status === FlashSaleStatus.ACTIVE) {
      await this.initializeStockCache(flashSale.id, flashSale.items);
    } else if (dto.status === FlashSaleStatus.ENDED || dto.status === FlashSaleStatus.CANCELLED) {
      await this.clearStockCache(flashSale.id);
    }

    await this.clearCache(id);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id },
    });
    if (!flashSale) {
      throw new NotFoundException('秒杀活动不存在');
    }

    if (flashSale.status === FlashSaleStatus.ACTIVE) {
      throw new BadRequestException('活动进行中，无法删除');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
      await tx.flashSale.delete({ where: { id } });
    });

    await this.clearCache(id);
    await this.clearStockCache(id);
  }

  async findById(id: string): Promise<FlashSale & { items: FlashSaleItem[] }> {
    const cacheKey = generateCacheKey(FLASH_SALE_CACHE_PREFIX, id);
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sku: true,
            spu: true,
          },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });
    if (!flashSale) {
      throw new NotFoundException('秒杀活动不存在');
    }

    const result = await this.enrichWithStockInfo(flashSale);

    await this.redisService.set(cacheKey, JSON.stringify(result), CACHE_TTL);
    return result;
  }

  async findPaginated(query: FlashSaleQueryDto): Promise<PaginationResult<FlashSale & { items: FlashSaleItem[] }>> {
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.flashSale.count({ where }),
      this.prisma.flashSale.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        include: {
          items: {
            include: {
              sku: true,
              spu: true,
            },
            orderBy: [
              { sortOrder: 'asc' },
              { createdAt: 'desc' },
            ],
          },
        },
        orderBy: [
          { startTime: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
    ]);

    const enrichedItems = await Promise.all(
      items.map(item => this.enrichWithStockInfo(item)),
    );

    return buildPaginationResult(enrichedItems, total, query.page, query.pageSize);
  }

  async findActiveItems(flashSaleId: string, query: FlashSaleItemQueryDto): Promise<PaginationResult<FlashSaleItem>> {
    const flashSale = await this.findById(flashSaleId);
    if (flashSale.status !== FlashSaleStatus.ACTIVE) {
      throw new BadRequestException('活动未开始或已结束');
    }

    const now = new Date();
    if (now < flashSale.startTime) {
      throw new BadRequestException('活动未开始');
    }
    if (now > flashSale.endTime) {
      throw new BadRequestException('活动已结束');
    }

    const where: Record<string, unknown> = { flashSaleId };

    const [total, items] = await Promise.all([
      this.prisma.flashSaleItem.count({ where }),
      this.prisma.flashSaleItem.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        include: {
          sku: true,
          spu: true,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { soldCount: 'desc' },
        ],
      }),
    ]);

    const enrichedItems = await Promise.all(
      items.map(item => this.enrichItemWithStockInfo(item)),
    );

    return buildPaginationResult(enrichedItems, total, query.page, query.pageSize);
  }

  async purchase(dto: FlashSalePurchaseDto): Promise<{ success: boolean; orderId?: string; message?: string }> {
    const flashSale = await this.prisma.flashSale.findUnique({
      where: { id: dto.flashSaleId },
      include: { items: true },
    });
    if (!flashSale) {
      throw new NotFoundException('秒杀活动不存在');
    }

    if (flashSale.status !== FlashSaleStatus.ACTIVE) {
      throw new BadRequestException('活动未开始或已结束');
    }

    const now = new Date();
    if (now < flashSale.startTime) {
      throw new BadRequestException('活动未开始');
    }
    if (now > flashSale.endTime) {
      throw new BadRequestException('活动已结束');
    }

    const flashSaleItem = flashSale.items.find(item => item.id === dto.itemId);
    if (!flashSaleItem) {
      throw new NotFoundException('秒杀商品不存在');
    }

    const stockKey = `${FLASH_SALE_STOCK_CACHE_PREFIX}${dto.flashSaleId}:${dto.itemId}`;
    const userKey = `${FLASH_SALE_USER_LIMIT_PREFIX}${dto.flashSaleId}:${dto.userId}`;
    const lockKey = `${FLASH_SALE_LOCK_PREFIX}${dto.flashSaleId}:${dto.itemId}:${dto.userId}`;
    const lockValue = generateUUID();

    const stockExists = await this.redisService.exists(stockKey);
    if (!stockExists) {
      await this.initializeStockCache(dto.flashSaleId, flashSale.items);
    }

    const result = await this.redisService.eval(
      DEDUCT_STOCK_LUA_SCRIPT,
      [stockKey, userKey, lockKey],
      [dto.quantity, flashSaleItem.limitPerUser, dto.userId, lockValue],
    ) as Record<string, unknown>;

    if (result.error) {
      throw new BadRequestException(result.message as string);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.flashSaleItem.update({
          where: { id: dto.itemId },
          data: {
            soldCount: { increment: dto.quantity },
          },
        });

        await tx.flashSale.update({
          where: { id: dto.flashSaleId },
          data: {
            soldCount: { increment: dto.quantity },
          },
        });

        await this.skuService.lockStock(
          [{ skuId: flashSaleItem.skuId, quantity: dto.quantity }],
          `flash_sale:${dto.flashSaleId}:${dto.userId}`,
        );
      });

      const orderId = generateUUID();
      await this.clearCache(dto.flashSaleId);

      return {
        success: true,
        orderId,
      };
    } catch (error) {
      await this.redisService.eval(
        ROLLBACK_STOCK_LUA_SCRIPT,
        [stockKey, userKey],
        [dto.quantity],
      );
      throw error;
    }
  }

  private async initializeStockCache(flashSaleId: string, items: FlashSaleItem[]): Promise<void> {
    const pipeline = this.redisService.getClient().pipeline();

    for (const item of items) {
      const stockKey = `${FLASH_SALE_STOCK_CACHE_PREFIX}${flashSaleId}:${item.id}`;
      const remainingStock = item.saleStock - item.soldCount;
      pipeline.set(stockKey, remainingStock);
    }

    await pipeline.exec();
  }

  private async clearStockCache(flashSaleId: string): Promise<void> {
    const stockKeys = await this.redisService.getClient().keys(
      `${FLASH_SALE_STOCK_CACHE_PREFIX}${flashSaleId}:*`,
    );
    if (stockKeys.length > 0) {
      await this.redisService.getClient().del(...stockKeys);
    }

    const userKeys = await this.redisService.getClient().keys(
      `${FLASH_SALE_USER_LIMIT_PREFIX}${flashSaleId}:*`,
    );
    if (userKeys.length > 0) {
      await this.redisService.getClient().del(...userKeys);
    }
  }

  private async enrichWithStockInfo(
    flashSale: FlashSale & { items: (FlashSaleItem & { sku?: unknown; spu?: unknown })[] },
  ): Promise<FlashSale & { items: FlashSaleItemType[] }> {
    const enrichedItems = await Promise.all(
      flashSale.items.map(item => this.enrichItemWithStockInfo(item)),
    );

    return {
      ...flashSale,
      items: enrichedItems,
    };
  }

  private async enrichItemWithStockInfo(
    item: FlashSaleItem & { sku?: unknown; spu?: unknown },
  ): Promise<FlashSaleItemType> {
    const stockKey = `${FLASH_SALE_STOCK_CACHE_PREFIX}${item.flashSaleId}:${item.id}`;
    const cachedStock = await this.cacheService.get<string>(stockKey);
    const remainingStock = cachedStock
      ? parseInt(cachedStock, 10)
      : item.saleStock - item.soldCount;

    return {
      ...item,
      remainingStock,
      saleProgress: Math.round((item.soldCount / item.saleStock) * 100),
    } as unknown as FlashSaleItemType;
  }

  private async clearCache(id?: string): Promise<void> {
    if (id) {
      await this.redisService.del(generateCacheKey(FLASH_SALE_CACHE_PREFIX, id));
    } else {
      const keys = await this.redisService.getClient().keys(`${FLASH_SALE_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }
}
