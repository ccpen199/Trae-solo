import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@pet/db';
import { ConfigService } from '@nestjs/config';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { LogisticsQueryDto, SubscribeLogisticsDto, LogisticsListQueryDto } from './dto';

@Injectable()
export class LogisticsService {
  private readonly prisma: PrismaClient;
  private readonly kuaidi100Key: string;
  private readonly kuaidi100Customer: string;

  constructor(private readonly configService: ConfigService) {
    this.prisma = new PrismaClient();
    this.kuaidi100Key = this.configService.get<string>('KUAIDI100_KEY', '');
    this.kuaidi100Customer = this.configService.get<string>('KUAIDI100_CUSTOMER', '');
  }

  async query(dto: LogisticsQueryDto) {
    const shippingLogs = await this.prisma.shippingLog.findMany({
      where: { trackingNo: dto.trackingNo },
      orderBy: { eventTime: 'desc' },
    });
    if (shippingLogs.length === 0) {
      return this.queryFromKuaidi100(dto.trackingNo, dto.trackingCompany);
    }
    return shippingLogs;
  }

  async subscribe(dto: SubscribeLogisticsDto) {
    const existing = await this.prisma.shippingLog.findFirst({
      where: { trackingNo: dto.trackingNo, orderId: dto.orderId },
    });
    if (existing) {
      return { success: true, message: '已订阅' };
    }
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        trackingNo: dto.trackingNo,
        trackingCompany: dto.trackingCompany,
        shippingStatus: 'SHIPPED',
        shippedAt: new Date(),
      },
    });
    return { success: true, message: '订阅成功' };
  }

  async findPaginated(query: LogisticsListQueryDto): Promise<PaginationResult<unknown>> {
    const where: Record<string, unknown> = {};
    if (query.orderId) where.orderId = query.orderId;
    if (query.trackingNo) where.trackingNo = query.trackingNo;

    const [total, items] = await Promise.all([
      this.prisma.shippingLog.count({ where }),
      this.prisma.shippingLog.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        orderBy: { eventTime: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, query.page, query.pageSize);
  }

  private async queryFromKuaidi100(trackingNo: string, trackingCompany?: string) {
    if (!this.kuaidi100Key || !this.kuaidi100Customer) {
      return { message: '快递100 API未配置', trackingNo };
    }
    return {
      trackingNo,
      trackingCompany: trackingCompany || 'unknown',
      message: '请配置快递100 API密钥以获取实时物流信息',
    };
  }
}
