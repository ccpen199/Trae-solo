import { Request, Response } from 'express';
import { ApiResponse } from '@platform/shared';

export function ok<T>(res: Response, data?: T, message = 'success') {
  const response: ApiResponse<T> = {
    code: 0,
    message,
    data,
    timestamp: Date.now(),
    traceId: (res.req as Request).traceId,
  };
  return res.status(200).json(response);
}

export function fail(res: Response, code: number, message: string, statusCode = 400) {
  const response: ApiResponse = {
    code,
    message,
    timestamp: Date.now(),
    traceId: (res.req as Request).traceId,
  };
  return res.status(statusCode).json(response);
}

export function paginated<T>(
  res: Response,
  list: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return ok(res, { list, total, page, pageSize });
}
