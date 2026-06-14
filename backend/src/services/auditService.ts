import { AuditLog } from "../../generated/prisma";
import logger from "../utils/logger";
import prisma from "../lib/prisma";

interface CreateAuditLogParams {
  userId: string;
  action: string;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestDataEncrypted?: string;
  responseDataEncrypted?: string;
}

class AuditService {
  async createLog(params: CreateAuditLogParams): Promise<AuditLog> {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          requestDataEncrypted: params.requestDataEncrypted,
          responseDataEncrypted: params.responseDataEncrypted,
        },
      });
      return log;
    } catch (error) {
      logger.error("创建审计日志失败", { error, params });
      throw error;
    }
  }

  async getLogs(
    userId?: string,
    action?: string,
    targetType?: string,
    page = 1,
    pageSize = 20
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = action;
    }
    if (targetType) {
      where.targetType = targetType;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getLogById(id: string): Promise<AuditLog | null> {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }
}

export default new AuditService();
