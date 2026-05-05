import { prisma } from '../lib/prisma';

export interface LogOperationParams {
  userId: string;
  operation: string;
  module: string;
  targetId?: string;
  targetType?: string;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logOperation(params: LogOperationParams): Promise<void> {
  try {
    await prisma.operationLog.create({
      data: {
        userId: params.userId,
        operation: params.operation,
        module: params.module,
        targetId: params.targetId,
        targetType: params.targetType,
        detail: params.detail,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
}

export function getClientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const ipStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ipStr.split(',')[0].trim();
  }

  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return req.ip || 'unknown';
}

export function getUserAgent(req: { headers?: Record<string, string | string[] | undefined> }): string {
  const userAgent = req.headers?.['user-agent'];
  if (userAgent) {
    return Array.isArray(userAgent) ? userAgent[0] : userAgent;
  }
  return 'unknown';
}
