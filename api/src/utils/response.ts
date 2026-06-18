import { Response } from 'express';

export function success<T>(res: Response, data: T, message: string = 'success') {
  res.json({ code: 0, message, data });
}

export function error(res: Response, message: string, code: number = 1, statusCode: number = 400) {
  res.status(statusCode).json({ code, message, data: null });
}

export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message: string = 'success'
) {
  const totalPages = Math.ceil(total / pageSize);
  res.json({
    code: 0,
    message,
    data: { items, total, page, pageSize, totalPages },
  });
}
