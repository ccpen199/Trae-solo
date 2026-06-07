import { Response } from 'express';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
}

export function success<T>(res: Response, data: T, message: string = 'success'): Response<ApiResponse<T>> {
  return res.json({ code: 200, message, data });
}

export function error(res: Response, message: string, code: number = 400): Response<ApiResponse<null>> {
  return res.status(code).json({ code, message, data: null });
}
