import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code?: number;
}

export function success<T>(res: Response, data?: T, message: string = '操作成功'): Response<ApiResponse<T>> {
  return res.json({
    success: true,
    data,
    message
  });
}

export function error(res: Response, message: string = '操作失败', code: number = 500): Response<ApiResponse> {
  return res.status(code).json({
    success: false,
    message
  });
}
