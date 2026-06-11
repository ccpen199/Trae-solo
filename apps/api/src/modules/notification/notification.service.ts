import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { NotificationQueryDto, MarkReadDto } from './dto';

@Injectable()
export class NotificationService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findPaginated(userId: string, query: NotificationQueryDto): Promise<PaginationResult<unknown>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const where: Record<string, unknown> = { userId };
    if (query.type) where.type = query.type;
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';

    const [total, items] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }

  async markRead(userId: string, dto: MarkReadDto) {
    await this.prisma.activity.updateMany({
      where: { id: { in: dto.ids }, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllRead(userId: string, type?: string) {
    const where: Record<string, unknown> = { userId, isRead: false };
    if (type) where.type = type;
    await this.prisma.activity.updateMany({
      where,
      data: { isRead: true },
    });
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.activity.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async createNotification(userId: string, type: string, targetType: string, targetId: string, content: string) {
    return this.prisma.activity.create({
      data: { userId, type: type as any, targetType, targetId, content },
    });
  }
}
