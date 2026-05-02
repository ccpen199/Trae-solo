import { AuditAction } from '../types/constants';
import prisma from '../lib/prisma';
import { JWTPayload } from '../types';

interface AuditLogParams {
  user: JWTPayload;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  oldValue?: any;
  newValue?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  const {
    user,
    action,
    entityType,
    entityId,
    entityName,
    oldValue,
    newValue,
    changes,
    ipAddress,
    userAgent,
  } = params;

  return prisma.auditLog.create({
    data: {
      userId: user.userId,
      action,
      entityType,
      entityId,
      entityName,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      changes: changes ? JSON.stringify(changes) : null,
      ipAddress,
      userAgent,
    },
  });
}

export async function getEntityAuditLogs(entityType: string, entityId: string, page: number = 1, pageSize: number = 50) {
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({
      where: {
        entityType,
        entityId,
      },
    }),
  ]);

  return {
    data: logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUserAuditLogs(userId: string, page: number = 1, pageSize: number = 50) {
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    data: logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getChangeSummary(oldValue: any, newValue: any): object {
  const changes: { [key: string]: { old: any; new: any } } = {};

  const allKeys = new Set([...Object.keys(oldValue || {}), ...Object.keys(newValue || {})]);

  allKeys.forEach((key) => {
    const oldVal = oldValue ? oldValue[key] : undefined;
    const newVal = newValue ? newValue[key] : undefined;

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal, new: newVal };
    }
  });

  return changes;
}
