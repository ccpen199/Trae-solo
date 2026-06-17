import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '@platform/shared';

export function apiAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const _send = res.send;
  const originalJson = res.json;
  let responseCode = 200;
  let responseMessage = '';
  res.json = function(this: Response, body: any) {
    if (body && typeof body === 'object') {
      responseCode = body.code || res.statusCode;
      responseMessage = body.message || '';
    }
    return originalJson.call(this, body);
  } as any;
  res.send = function(this: Response, body: any) {
    const latency = Date.now() - startTime;
    const apiPath = req.baseUrl + req.path;
    const isSensitive = /(identity|payment|password|encrypt|key|secret|face|ocr)/i.test(apiPath);
    prisma.apiAccessLog.create({
      data: {
        traceId: req.traceId,
        apiName: `${req.method} ${req.route?.path || apiPath}`,
        apiPath,
        method: req.method,
        userId: req.user?.userId,
        userRole: req.user?.role,
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent'],
        requestParams: isSensitive ? { _masked: true } : {
          query: req.query,
          body: req.body ? { ...Object.fromEntries(Object.keys(req.body).map(k => [k, k.match(/password|encrypt|secret|key/i) ? '***' : req.body[k]])) } : undefined,
        },
        responseCode,
        responseMessage,
        latencyMs: latency,
        isSensitive,
      },
    }).catch(err => console.error('API access log error:', err.message));
    return _send.call(this, body);
  };
  next();
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const statusCode = (err as any).statusCode || (err as any).status || 500;
  const response: ApiResponse = {
    code: statusCode >= 500 ? 500 : statusCode,
    message: statusCode >= 500 ? '服务器内部错误' : err.message || '请求处理失败',
    timestamp: Date.now(),
    traceId: req.traceId,
  };
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    (response as any).stack = err.stack;
  }
  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.path}`,
    timestamp: Date.now(),
    traceId: req.traceId,
  } as ApiResponse);
}
