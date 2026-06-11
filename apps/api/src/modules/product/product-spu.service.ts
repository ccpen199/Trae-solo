import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductSPU, ProductStatus, Prisma } from '@pet/db';
import type { JsonValue } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../redis/cache.service';
import { RedisService } from '../redis/redis.service';
import { generateCacheKey, calculateOffset, buildPaginationResult } from '@pet/shared/utils';
import type { PaginationResult, ProductAttribute, ProductSKU } from '@pet/shared/types';
import { CreateProductSpuDto, UpdateProductSpuDto, UpdateProductSpuStatusDto, ProductSpuQueryDto } from './dto';

const SPU_CACHE_PREFIX = 'product:spu:';
const CACHE_TTL = 60 * 60;

@Injectable()
export class ProductSpuService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateProductSpuDto): Promise<ProductSPU & { attributes: ProductAttribute[]; skus: ProductSKU[] }> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: dto.merchantId },
    });
    if (!merchant) {
      throw new NotFoundException('商户不存在');
    }

    const category = await this.prisma.productCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('类目不存在');
    }

    const skuCodes = dto.skus.map(sku => sku.skuCode);
    const existingSku = await this.prisma.productSKU.findFirst({
      where: { skuCode: { in: skuCodes } },
    });
    if (existingSku) {
      throw new BadRequestException('SKU编码已存在');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const spu = await tx.productSPU.create({
        data: {
          merchantId: dto.merchantId,
          categoryId: dto.categoryId,
          name: dto.name,
          subtitle: dto.subtitle,
          description: dto.description,
          mainImage: dto.mainImage,
          images: dto.images,
          videos: dto.videos || [],
          status: ProductStatus.DRAFT,
        },
      });

      const attributes = await Promise.all(
        dto.attributes.map(attr =>
          tx.productAttribute.create({
            data: {
              spuId: spu.id,
              name: attr.name,
              values: attr.values as unknown as Prisma.JsonValue,
              isVariant: attr.isVariant,
            },
          }),
        ),
      );

      const skus = await Promise.all(
        dto.skus.map(sku =>
          tx.productSKU.create({
            data: {
              spuId: spu.id,
              skuCode: sku.skuCode,
              attributes: sku.attributes as unknown as JsonValue,
              price: sku.price,
              originalPrice: sku.originalPrice,
              cost: sku.cost,
              stock: sku.stock,
              weight: sku.weight,
              barcode: sku.barcode,
              image: sku.image,
              status: sku.status,
            },
          }),
        ),
      );

      return { ...spu, attributes, skus };
    });

    await this.clearCache();
    return result;
  }

  async update(id: string, dto: UpdateProductSpuDto): Promise<ProductSPU> {
    const spu = await this.prisma.productSPU.findUnique({
      where: { id },
    });
    if (!spu) {
      throw new NotFoundException('商品不存在');
    }

    if (dto.categoryId) {
      const category = await this.prisma.productCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('类目不存在');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.productSPU.update({
        where: { id },
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          subtitle: dto.subtitle,
          description: dto.description,
          mainImage: dto.mainImage,
          images: dto.images,
          videos: dto.videos,
        },
      });

      if (dto.attributes) {
        await tx.productAttribute.deleteMany({ where: { spuId: id } });
        await Promise.all(
          dto.attributes.map(attr =>
            tx.productAttribute.create({
              data: {
                spuId: id,
                name: attr.name,
                values: attr.values as unknown as Prisma.JsonValue,
                isVariant: attr.isVariant,
              },
            }),
          ),
        );
      }

      return result;
    });

    await this.clearCache(id);
    return updated;
  }

  async updateStatus(id: string, dto: UpdateProductSpuStatusDto): Promise<ProductSPU> {
    const spu = await this.prisma.productSPU.findUnique({
      where: { id },
    });
    if (!spu) {
      throw new NotFoundException('商品不存在');
    }

    if (dto.status === ProductStatus.ON_SALE && spu.status !== ProductStatus.PENDING) {
      throw new BadRequestException('商品需审核通过后才能上架');
    }

    if (dto.status === ProductStatus.REJECTED && !dto.auditReason) {
      throw new BadRequestException('驳回需填写原因');
    }

    const updated = await this.prisma.productSPU.update({
      where: { id },
      data: {
        status: dto.status,
        auditReason: dto.auditReason,
      },
    });

    await this.clearCache(id);
    return updated;
  }

  async onSale(id: string): Promise<ProductSPU> {
    return this.updateStatus(id, { status: ProductStatus.ON_SALE });
  }

  async offSale(id: string): Promise<ProductSPU> {
    const spu = await this.prisma.productSPU.findUnique({
      where: { id },
    });
    if (!spu) {
      throw new NotFoundException('商品不存在');
    }
    if (spu.status !== ProductStatus.ON_SALE) {
      throw new BadRequestException('商品未上架');
    }

    const updated = await this.prisma.productSPU.update({
      where: { id },
      data: { status: ProductStatus.OFF_SALE },
    });

    await this.clearCache(id);
    return updated;
  }

  async submitAudit(id: string): Promise<ProductSPU> {
    const spu = await this.prisma.productSPU.findUnique({
      where: { id },
      include: { skus: true, attributes: true },
    });
    if (!spu) {
      throw new NotFoundException('商品不存在');
    }
    if (spu.status !== ProductStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的商品才能提交审核');
    }
    if (spu.skus.length === 0) {
      throw new BadRequestException('请至少添加一个SKU');
    }

    const updated = await this.prisma.productSPU.update({
      where: { id },
      data: { status: ProductStatus.PENDING },
    });

    await this.clearCache(id);
    return updated;
  }

  async delete(id: string, merchantId?: string): Promise<void> {
    const spu = await this.prisma.productSPU.findUnique({
      where: { id },
    });
    if (!spu) {
      throw new NotFoundException('商品不存在');
    }

    if (merchantId && spu.merchantId !== merchantId) {
      throw new ForbiddenException('无权限删除该商品');
    }

    if (spu.status === ProductStatus.ON_SALE) {
      throw new BadRequestException('请先下架商品');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productSKU.deleteMany({ where: { spuId: id } });
      await tx.productAttribute.deleteMany({ where: { spuId: id } });
      await tx.productSPU.delete({ where: { id } });
    });

    await this.clearCache(id);
  }

  async findById(id: string): Promise<ProductSPU & { attributes: ProductAttribute[]; skus: ProductSKU[] }> {
    const cacheKey = generateCacheKey(SPU_CACHE_PREFIX, id);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const spu = await this.prisma.productSPU.findUnique({
      where: { id },
      include: {
        attributes: true,
        skus: true,
        category: true,
        merchant: true,
      },
    });
    if (!spu) {
      throw new NotFoundException('商品不存在');
    }

    const result = {
      ...spu,
      attributes: spu.attributes.map(attr => ({
        ...attr,
        values: attr.values as unknown as string[],
      })),
      skus: spu.skus.map(sku => ({
        ...sku,
        attributes: sku.attributes as unknown as Record<string, string>,
      })),
    };

    await this.cacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async findPaginated(query: ProductSpuQueryDto): Promise<PaginationResult<ProductSPU>> {
    const where: Record<string, unknown> = {};

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { subtitle: { contains: query.keyword } },
      ];
    }
    if (query.merchantId) {
      where.merchantId = query.merchantId;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.productSPU.count({ where }),
      this.prisma.productSPU.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        include: {
          attributes: true,
          skus: true,
          category: true,
        },
        orderBy,
      }),
    ]);

    const transformedItems = items.map(item => ({
      ...item,
      attributes: item.attributes.map(attr => ({
        ...attr,
        values: attr.values as unknown as string[],
      })),
      skus: item.skus.map(sku => ({
        ...sku,
        attributes: sku.attributes as unknown as Record<string, string>,
      })),
    }));

    return buildPaginationResult(transformedItems, total, query.page, query.pageSize);
  }

  async incrementSalesCount(spuId: string, quantity: number): Promise<void> {
    await this.prisma.productSPU.update({
      where: { id: spuId },
      data: { salesCount: { increment: quantity } },
    });
    await this.clearCache(spuId);
  }

  private async clearCache(id?: string): Promise<void> {
    if (id) {
      await this.cacheService.del(generateCacheKey(SPU_CACHE_PREFIX, id));
    } else {
      const keys = await this.redisService.getClient().keys(`${SPU_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }
}
