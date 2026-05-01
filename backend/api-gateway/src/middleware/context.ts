import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContext } from '../types';
import { logger } from '../utils/logger';

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const sessionId = (req.headers['x-session-id'] as string) || undefined;
  const deviceId = (req.headers['x-device-id'] as string) || undefined;

  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    'unknown';

  const userAgent = req.headers['user-agent'] || 'unknown';

  const context: RequestContext = {
    requestId,
    startTime: Date.now(),
    sessionId,
    deviceId,
    ipAddress,
    userAgent,
  };

  req.context = context;

  res.setHeader('X-Request-ID', requestId);

  logger.debug('Request context initialized', {
    requestId,
    method: req.method,
    path: req.path,
    ipAddress,
    userAgent,
  });

  next();
};

export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body: unknown) {
    const responseTime = Date.now() - req.context.startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    logger.info('Request completed', {
      requestId: req.context.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userId: req.context.userId,
    });

    return originalJson.call(this, body);
  };

  next();
};
