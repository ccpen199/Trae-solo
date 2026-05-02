import { AuditAction } from '../constants/enums';
import prisma from '../lib/prisma';

export interface AuditLogCreateInput {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  extraInfo?: Record<string, unknown>;
}

export class AuditLogService {
  async log(input: AuditLogCreateInput) {
    return prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        previousValue: input.previousValue ? JSON.stringify(input.previousValue) : null,
        newValue: input.newValue ? JSON.stringify(input.newValue) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        extraInfo: input.extraInfo ? JSON.stringify(input.extraInfo) : null,
      },
    });
  }

  async logCreate(
    resourceType: string,
    resourceId: string,
    newValue: Record<string, unknown>,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.CREATE,
      resourceType,
      resourceId,
      newValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logUpdate(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    newValue: Record<string, unknown>,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.UPDATE,
      resourceType,
      resourceId,
      previousValue,
      newValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logDelete(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown>,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.DELETE,
      resourceType,
      resourceId,
      previousValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logConfirm(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.CONFIRM,
      resourceType,
      resourceId,
      previousValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logCancel(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.CANCEL,
      resourceType,
      resourceId,
      previousValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logRefund(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.REFUND,
      resourceType,
      resourceId,
      previousValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logAssign(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    newValue: Record<string, unknown>,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.ASSIGN,
      resourceType,
      resourceId,
      previousValue,
      newValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logComplete(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.COMPLETE,
      resourceType,
      resourceId,
      previousValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logSync(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    newValue: Record<string, unknown>,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.SYNC,
      resourceType,
      resourceId,
      previousValue,
      newValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async logManualReview(
    resourceType: string,
    resourceId: string,
    previousValue: Record<string, unknown> | null,
    newValue: Record<string, unknown>,
    userId?: string,
    extra?: { ip?: string; userAgent?: string; extraInfo?: Record<string, unknown> }
  ) {
    return this.log({
      userId,
      action: AuditAction.MANUAL_REVIEW,
      resourceType,
      resourceId,
      previousValue,
      newValue,
      ipAddress: extra?.ip,
      userAgent: extra?.userAgent,
      extraInfo: extra?.extraInfo,
    });
  }

  async getLogsForResource(resourceType: string, resourceId: string, limit: number = 100) {
    return prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getLogsForUser(userId: string, limit: number = 100) {
    return prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const auditLogService = new AuditLogService();
export default auditLogService;
