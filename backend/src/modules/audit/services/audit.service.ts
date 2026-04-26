import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LogAction, Role } from '../../common/enums';

interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: LogAction;
  operatorId: string;
  operatorName: string;
  operatorRole: Role;
  oldValue?: any;
  newValue?: any;
  changeSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  remark?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createLog(params: AuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        operatorId: params.operatorId,
        operatorName: params.operatorName,
        operatorRole: params.operatorRole,
        oldValue: params.oldValue,
        newValue: params.newValue,
        changeSummary: params.changeSummary,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        remark: params.remark,
      },
    });
  }

  async getLogsByEntity(entityType: string, entityId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          operator: {
            omit: { password: true },
          },
        },
      }),
      this.prisma.auditLog.count({
        where: { entityType, entityId },
      }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getLogsByOperator(operatorId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { operatorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({
        where: { operatorId },
      }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getAllLogs(
    filters: {
      entityType?: string;
      action?: LogAction;
      operatorRole?: Role;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.operatorRole) {
      where.operatorRole = filters.operatorRole;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          operator: {
            omit: { password: true },
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

  async getOrderTraceabilityChain(orderId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'Order', entityId: orderId },
          { entityType: 'SubOrder', entityId: { in: await this.getSubOrderIds(orderId) } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        operator: {
          omit: { password: true },
        },
      },
    });

    const traceabilityChain = logs.map(log => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      operator: {
        id: log.operatorId,
        name: log.operatorName,
        role: log.operatorRole,
      },
      changeSummary: log.changeSummary,
      oldValue: log.oldValue,
      newValue: log.newValue,
      timestamp: log.createdAt,
      remark: log.remark,
    }));

    return {
      orderId,
      traceabilityChain,
      totalEvents: traceabilityChain.length,
    };
  }

  private async getSubOrderIds(orderId: string): Promise<string[]> {
    const subOrders = await this.prisma.subOrder.findMany({
      where: { mainOrderId: orderId },
      select: { id: true },
    });
    return subOrders.map(so => so.id);
  }
}
