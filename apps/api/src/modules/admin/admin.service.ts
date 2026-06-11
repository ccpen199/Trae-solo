import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { SystemConfigDto, UpdateSystemConfigDto, DashboardQueryDto, SystemConfigQueryDto } from './dto';

@Injectable()
export class AdminService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getDashboardStats(query?: DashboardQueryDto) {
    const startDate = query?.startDate ? new Date(query.startDate) : undefined;
    const endDate = query?.endDate ? new Date(query.endDate) : undefined;
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    const userWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
      totalUsers,
      totalOrders,
      totalMerchants,
      totalPosts,
      totalProducts,
      todayOrders,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.user.count({ where: userWhere }),
      this.prisma.order.count({ where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {} }),
      this.prisma.merchant.count({ where: { status: 'APPROVED' } }),
      this.prisma.post.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.productSPU.count({ where: { status: 'ON_SALE' } }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { actualAmount: true },
        where: {
          paymentStatus: 'PAID',
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        },
      }),
    ]);

    return {
      totalUsers,
      totalOrders,
      totalMerchants,
      totalPosts,
      totalProducts,
      todayOrders,
      todayRevenue: todayRevenue._sum.actualAmount || 0,
    };
  }

  async getSystemConfigs(query: SystemConfigQueryDto): Promise<PaginationResult<unknown>> {
    const where: Record<string, unknown> = {};
    if (query.group) where.group = query.group;
    if (query.isPublic !== undefined) where.isPublic = query.isPublic;

    const [total, items] = await Promise.all([
      this.prisma.systemConfig.count({ where }),
      this.prisma.systemConfig.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        orderBy: { group: 'asc' },
      }),
    ]);
    return buildPaginationResult(items, total, query.page, query.pageSize);
  }

  async createSystemConfig(dto: SystemConfigDto) {
    return this.prisma.systemConfig.create({
      data: {
        key: dto.key,
        value: dto.value,
        type: dto.type ?? 'string',
        group: dto.group ?? 'default',
        isPublic: dto.isPublic ?? false,
        remark: dto.remark,
      },
    });
  }

  async updateSystemConfig(key: string, dto: UpdateSystemConfigDto) {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (!config) {
      return this.prisma.systemConfig.create({
        data: {
          key,
          value: dto.value,
          type: dto.type ?? 'string',
          isPublic: dto.isPublic ?? false,
          remark: dto.remark,
        },
      });
    }
    return this.prisma.systemConfig.update({
      where: { key },
      data: {
        value: dto.value,
        type: dto.type,
        isPublic: dto.isPublic,
        remark: dto.remark,
      },
    });
  }

  async deleteSystemConfig(key: string) {
    await this.prisma.systemConfig.delete({ where: { key } });
    return { success: true };
  }
}
