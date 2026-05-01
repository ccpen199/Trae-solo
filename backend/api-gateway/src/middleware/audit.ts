import { Request, Response, NextFunction } from 'express';
import { AuditLogData, audit_action } from '../types';
import { logger } from '../utils/logger';
import Redis from 'ioredis';
import { config } from '../config';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

const AUDIT_LOG_QUEUE = 'audit_logs';

const determineAction = (method: string, path: string): audit_action => {
  if (path.includes('/upload')) return 'upload';
  if (path.includes('/download')) return 'download';
  if (path.includes('/approve')) return 'approve';
  if (path.includes('/reject')) return 'reject';

  switch (method.toLowerCase()) {
    case 'post':
      return 'create';
    case 'put':
    case 'patch':
      return 'update';
    case 'delete':
      return 'delete';
    case 'get':
    default:
      return 'view';
  }
};

const extractResourceType = (path: string): string => {
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[0] === 'api') {
    return segments[1];
  }
  return 'unknown';
};

export const auditMiddleware = (serviceName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const action = determineAction(req.method, req.path);
    const resourceType = extractResourceType(req.path);

    res.send = function (body: unknown) {
      const responseTime = Date.now() - req.context.startTime;
      const isSuccessful = res.statusCode >= 200 && res.statusCode < 400;

      const auditLog: AuditLogData = {
        userId: req.context.userId,
        action,
        resourceType,
        requestId: req.context.requestId,
        sessionId: req.context.sessionId,
        deviceId: req.context.deviceId,
        ipAddress: req.context.ipAddress,
        userAgent: req.context.userAgent,
        serviceName,
        requestPath: req.path,
        requestMethod: req.method,
        responseStatus: res.statusCode,
        responseTime,
        isSuccessful,
        errorMessage: !isSuccessful && typeof body === 'string' ? body : undefined,
      };

      redisClient
        .rpush(AUDIT_LOG_QUEUE, JSON.stringify(auditLog))
        .catch((error) => {
          logger.error('Failed to queue audit log', {
            error: error.message,
            auditLog,
          });
        });

      logger.debug('Audit log queued', {
        requestId: req.context.requestId,
        action,
        resourceType,
        status: res.statusCode,
      });

      return originalSend.call(this, body);
    };

    next();
  };
};

export const processAuditLogs = async () => {
  try {
    while (true) {
      const result = await redisClient.blpop(AUDIT_LOG_QUEUE, 0);
      if (!result) continue;

      const [, auditLogJson] = result;
      const auditLog: AuditLogData = JSON.parse(auditLogJson);

      logger.info('Audit log processed', {
        auditLog,
      });
    }
  } catch (error) {
    logger.error('Error processing audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    setTimeout(processAuditLogs, 5000);
  }
};
