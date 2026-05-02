import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditModule } from '@hospital/shared';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async logAudit(params: {
    action: AuditAction;
    module: AuditModule;
    entityId?: string;
    entityType?: string;
    details?: any;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          module: params.module,
          entityId: params.entityId,
          entityType: params.entityType,
          details: params.details ? JSON.stringify(params.details) : null,
          userId: params.userId,
          ipAddress: params.ip,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('审计日志记录失败', error);
    }
  }

  async getAuditLogs(filters?: {
    module?: AuditModule;
    action?: AuditAction;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    entityId?: string;
  }): Promise<any[]> {
    const where: any = {};

    if (filters?.module) {
      where.module = filters.module;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    byModule: Record<string, number>;
    byAction: Record<string, number>;
    byUser: Array<{ userId: string; username: string; count: number }>;
  }> {
    const normalizedDate = date
      ? this.normalizeDate(date)
      : this.normalizeDate(new Date());

    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    const byModule: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const userMap: Map<string, { userId: string; username: string; count: number }> = new Map();

    for (const log of logs) {
      byModule[log.module] = (byModule[log.module] || 0) + 1;
      byAction[log.action] = (byAction[log.action] || 0) + 1;

      if (log.userId && log.user) {
        const existing = userMap.get(log.userId);
        if (existing) {
          existing.count++;
        } else {
          userMap.set(log.userId, {
            userId: log.userId,
            username: log.user.username,
            count: 1,
          });
        }
      }
    }

    return {
      total: logs.length,
      byModule,
      byAction,
      byUser: Array.from(userMap.values()).sort((a, b) => b.count - a.count),
    };
  }

  async getEntityHistory(entityId: string, entityType?: string): Promise<any[]> {
    const where: any = { entityId };
    if (entityType) {
      where.entityType = entityType;
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
