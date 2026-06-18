import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  const start = Date.now();

  const originalSend = res.send;
  res.send = function(this: any, ...args: any[]) {
    const duration = Date.now() - start;
    const bodySize = typeof args[0] === 'string' ? Buffer.byteLength(args[0], 'utf8') : 0;

    if (res.statusCode >= 400) {
      const logger = require('../utils/logger').default;
      logger.warn('[Request]', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        bodySize: `${bodySize}B`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    return originalSend.apply(this, args);
  };

  next();
};
