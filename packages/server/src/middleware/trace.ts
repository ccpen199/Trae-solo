import { Request, Response, NextFunction } from 'express';
import { generateTraceId } from '@platform/shared';

export function traceMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.traceId = (req.headers['x-trace-id'] as string) || generateTraceId();
  _res.setHeader('X-Trace-Id', req.traceId);
  next();
}
