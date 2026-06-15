import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Department } from '@prisma/client';
import {
  CreateServiceItemDto,
  UpdateServiceItemDto,
  ServiceItemQueryDto,
} from './dto/service-item.dto';
import { generateItemCode } from '@/common/utils/id-generator.util';
import { BusinessException } from '@/common/exceptions/business.exception';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class ServiceItemService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateServiceItemDto) {
    this.logger.log(`创建服务事项: ${dto.itemName}`, 'ServiceItemService');
    const count = await this.prisma.serviceItem.count({ where: { category: dto.category } });
    const itemCode = dto.itemCode || generateItemCode(dto.category, count + 1);

    const existing = await this.prisma.serviceItem.findUnique({ where: { itemCode } });
    if (existing) {
      throw new BusinessException('事项编码已存在', 'ITEM_CODE_EXISTS');
    }

    return this.prisma.serviceItem.create({
      data: {
        ...dto,
        itemCode,
      },
      include: {
        materials: true,
        formTemplates: true,
      },
    });
  }

  async findAll(query: ServiceItemQueryDto) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { itemName: { contains: query.keyword } },
        { itemCode: { contains: query.keyword } },
        { itemAlias: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.subCategory) where.subCategory = query.subCategory;
    if (query.handlingDepartment) where.handlingDepartment = query.handlingDepartment as Department;
    if (query.status !== undefined) where.status = query.status;

    const [list, total] = await Promise.all([
      this.prisma.serviceItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          materials: { orderBy: { sortOrder: 'asc' } },
          formTemplates: { where: { isActive: true } },
        },
      }),
      this.prisma.serviceItem.count({ where }),
    ]);

    return {
      list,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.serviceItem.findUnique({
      where: { id },
      include: {
        materials: { orderBy: { sortOrder: 'asc' } },
        formTemplates: { where: { isActive: true } },
        children: true,
        parent: true,
      },
    });
    if (!item) {
      throw new NotFoundException('服务事项不存在');
    }
    return item;
  }

  async findByCode(itemCode: string) {
    const item = await this.prisma.serviceItem.findUnique({
      where: { itemCode },
      include: {
        materials: { orderBy: { sortOrder: 'asc' } },
        formTemplates: { where: { isActive: true } },
      },
    });
    if (!item) {
      throw new NotFoundException('服务事项不存在');
    }
    return item;
  }

  async update(id: string, dto: UpdateServiceItemDto) {
    this.logger.log(`更新服务事项: ${id}`, 'ServiceItemService');
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('服务事项不存在');
    }
    return this.prisma.serviceItem.update({
      where: { id },
      data: {
        ...dto,
        version: item.version + 1,
      },
      include: { materials: true, formTemplates: true },
    });
  }

  async remove(id: string) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('服务事项不存在');
    }
    const appCount = await this.prisma.application.count({ where: { serviceItemId: id } });
    if (appCount > 0) {
      throw new BusinessException('该事项已有办件记录，无法删除', 'ITEM_HAS_APPLICATIONS');
    }
    return this.prisma.serviceItem.delete({ where: { id } });
  }

  async getTree() {
    const roots = await this.prisma.serviceItem.findMany({
      where: { parentId: null },
      orderBy: { category: 'asc' },
      include: { children: true },
    });
    return roots;
  }

  async getHotItems(limit = 10) {
    const hotItems = await this.prisma.serviceHotSpot.groupBy({
      by: ['serviceItemId'],
      _sum: { applyCount: true },
      orderBy: { _sum: { applyCount: 'desc' } },
      take: limit,
    });
    const ids = hotItems.map((h) => h.serviceItemId);
    return this.prisma.serviceItem.findMany({
      where: { id: { in: ids } },
      include: { materials: { take: 3 } },
    });
  }
}
