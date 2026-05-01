import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContext } from '../types';
import { logger } from '../utils/logger';

export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const userId = (req.headers['x-user-id'] as string) || undefined;
  const userRole = (req.headers['x-user-role'] as string) || undefined;

  const ipAddress =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.ip ||
    'unknown';

  const userAgent = req.headers['user-agent'] || 'unknown';

  const context: RequestContext = {
    requestId,
    userId,
    userRole,
    ipAddress,
    userAgent,
  };

  req.context = context;

  res.setHeader('X-Request-ID', requestId);

  logger.debug('Request context initialized', {
    requestId,
    method: req.method,
    path: req.path,
    userId,
    userRole,
  });

  next();
};
