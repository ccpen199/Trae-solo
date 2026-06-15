import { Response } from 'express';

export function success<T>(res: Response, data: T, message = 'success') {
  return res.json({ code: 0, message, data });
}

export function error(res: Response, message: string, code = 500, statusCode = 500) {
  return res.status(statusCode).json({ code, message, data: null });
}

export function paginatedSuccess<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'success'
) {
  return res.json({
    code: 0,
    message,
    data: { items, total, page, pageSize },
  });
}

export function parsePagination(query: any): { page: number; pageSize: number; offset: number } {
  const page = parseInt(query.page as string) || 1;
  const pageSize = parseInt(query.pageSize as string) || 10;
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export const PLATFORM_FEE_RATE = 0.15;
