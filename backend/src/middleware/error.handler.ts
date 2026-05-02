import { Request, Response, NextFunction } from 'express';
import * as response from '../utils/response';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('[ERROR]', err.message);
  console.error('[STACK]', err.stack);

  if (err.message.includes('不存在') || err.message.includes('not found')) {
    return res.status(404).json(response.notFound(err.message));
  }

  if (err.message.includes('无权') || err.message.includes('权限')) {
    return res.status(403).json(response.forbidden(err.message));
  }

  if (err.message.includes('重复') || err.message.includes('已存在')) {
    return res.status(409).json(response.conflict(err.message));
  }

  if (err.message.includes('必填') || err.message.includes('参数') || err.message.includes('invalid')) {
    return res.status(400).json(response.badRequest(err.message));
  }

  res.status(500).json(response.error(err.message || '服务器内部错误'));
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(response.notFound('请求的资源不存在'));
}
