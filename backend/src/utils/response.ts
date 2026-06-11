import { Response } from 'express';
import { ApiResponse } from '../types';

export function success<T>(res: Response, data: T, message: string = 'ok'): Response {
  const response: ApiResponse<T> = { code: 0, message, data };
  return res.json(response);
}

export function error(res: Response, message: string, code: number = 1000, status: number = 400): Response {
  const response: ApiResponse<null> = { code, message, data: null };
  return res.status(status).json(response);
}
