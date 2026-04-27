import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransitionContext } from '../state-machine/types/state-machine.types';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: string,
    targetType: string,
    targetId: string,
    context: TransitionContext,
    beforeData?: Record<string, unknown>,
    afterData?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: context.userId,
        action,
        targetType,
        targetId,
        beforeData: beforeData as object,
        afterData: afterData as object,
        ip: context.ip,
        userAgent: context.userAgent,
      },
    });
  }

  async logStateTransition(
    machineName: string,
    entityId: string,
    fromState: string,
    toState: string,
    event: string,
    context: TransitionContext,
  ): Promise<void> {
    await this.log(
      'STATE_TRANSITION',
      machineName,
      entityId,
      context,
      { status: fromState },
      { status: toState, event },
    );
  }

  async logCreate(
    targetType: string,
    targetId: string,
    context: TransitionContext,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.log('CREATE', targetType, targetId, context, undefined, data);
  }

  async logUpdate(
    targetType: string,
    targetId: string,
    context: TransitionContext,
    beforeData: Record<string, unknown>,
    afterData: Record<string, unknown>,
  ): Promise<void> {
    await this.log('UPDATE', targetType, targetId, context, beforeData, afterData);
  }

  async logDelete(
    targetType: string,
    targetId: string,
    context: TransitionContext,
    data?: Record<string, unknown>,
  ): Promise<void> {
    await this.log('DELETE', targetType, targetId, context, data, undefined);
  }

  async getLogs(
    targetType?: string,
    targetId?: string,
    userId?: string,
    action?: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const where: Record<string, unknown> = {};

    if (targetType) {
      where.targetType = targetType;
    }

    if (targetId) {
      where.targetId = targetId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getEntityHistory(targetType: string, targetId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }
}
