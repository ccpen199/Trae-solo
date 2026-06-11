import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductCategory } from '@pet/db';
import { DatabaseService } from '../database/database.service';
import { CacheService } from '../redis/cache.service';
import { RedisService } from '../redis/redis.service';
import { generateCacheKey, buildTree, calculateOffset, buildPaginationResult } from '@pet/shared/utils';
import type { ProductCategoryNode, PaginationResult, ListQueryParams } from '@pet/shared/types';
import { CreateProductCategoryDto, UpdateProductCategoryDto, ProductCategoryQueryDto } from './dto';

const CATEGORY_CACHE_PREFIX = 'product:category:';
const CATEGORY_TREE_CACHE_KEY = 'product:category:tree';
const CACHE_TTL = 24 * 60 * 60;

@Injectable()
export class ProductCategoryService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    const existing = await this.prisma.productCategory.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('类目编码已存在');
    }

    if (dto.parentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('父类目不存在');
      }
      if (parent.level >= 3) {
        throw new BadRequestException('类目层级不能超过3级');
      }
      dto.level = parent.level + 1;
    }

    const category = await this.prisma.productCategory.create({
      data: dto,
    });

    await this.clearCache();
    return category;
  }

  async update(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('类目不存在');
    }

    if (dto.code && dto.code !== category.code) {
      const existing = await this.prisma.productCategory.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('类目编码已存在');
      }
    }

    const updated = await this.prisma.productCategory.update({
      where: { id },
      data: dto,
    });

    await this.clearCache();
    return updated;
  }

  async delete(id: string): Promise<void> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('类目不存在');
    }

    const children = await this.prisma.productCategory.findMany({
      where: { parentId: id },
    });
    if (children.length > 0) {
      throw new BadRequestException('请先删除子类目');
    }

    const products = await this.prisma.productSPU.findFirst({
      where: { categoryId: id },
    });
    if (products) {
      throw new BadRequestException('该类目下存在商品，无法删除');
    }

    await this.prisma.productCategory.delete({
      where: { id },
    });

    await this.clearCache();
  }

  async findById(id: string): Promise<ProductCategory> {
    const cacheKey = generateCacheKey(CATEGORY_CACHE_PREFIX, id);
    const cached = await this.cacheService.get<ProductCategory>(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('类目不存在');
    }

    await this.cacheService.set(cacheKey, category, CACHE_TTL);
    return category;
  }

  async findAll(query: ProductCategoryQueryDto): Promise<ProductCategory[]> {
    const where: Record<string, unknown> = {};

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { code: { contains: query.keyword } },
      ];
    }
    if (query.level !== undefined) {
      where.level = query.level;
    }
    if (query.parentId !== undefined) {
      where.parentId = query.parentId;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    return this.prisma.productCategory.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findTree(forceRefresh = false): Promise<ProductCategoryNode[]> {
    if (!forceRefresh) {
      const cached = await this.cacheService.get<ProductCategoryNode[]>(CATEGORY_TREE_CACHE_KEY);
      if (cached) {
        return cached;
      }
    }

    const categories = await this.prisma.productCategory.findMany({
      where: { status: true },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const tree = buildTree<ProductCategory & { children?: ProductCategory[] }>(categories);

    await this.cacheService.set(CATEGORY_TREE_CACHE_KEY, tree, CACHE_TTL);
    return tree as ProductCategoryNode[];
  }

  async findPaginated(params: ListQueryParams): Promise<PaginationResult<ProductCategory>> {
    const where: Record<string, unknown> = {};

    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { code: { contains: params.keyword } },
      ];
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'asc';
    } else {
      orderBy.sortOrder = 'asc';
      orderBy.createdAt = 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.productCategory.count({ where }),
      this.prisma.productCategory.findMany({
        where,
        skip: calculateOffset(params.page, params.pageSize),
        take: params.pageSize,
        orderBy,
      }),
    ]);

    return buildPaginationResult(items, total, params.page, params.pageSize);
  }

  async getChildren(parentId: string): Promise<ProductCategory[]> {
    return this.prisma.productCategory.findMany({
      where: { parentId, status: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPath(id: string): Promise<ProductCategory[]> {
    const category = await this.findById(id);
    const path: ProductCategory[] = [category];

    let currentId = category.parentId;
    while (currentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: currentId },
      });
      if (parent) {
        path.unshift(parent);
        currentId = parent.parentId;
      } else {
        break;
      }
    }

    return path;
  }

  private async clearCache(): Promise<void> {
    await this.cacheService.del(CATEGORY_TREE_CACHE_KEY);
    const keys = await this.redisService.getClient().keys(`${CATEGORY_CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await this.redisService.getClient().del(...keys);
    }
  }
}
