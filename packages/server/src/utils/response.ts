import { Response } from 'express';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export const success = <T>(res: Response, data?: T, message: string = 'success'): Response<ApiResponse<T>> => {
  return res.json({
    code: 200,
    message,
    data,
  });
};

export const error = (res: Response, message: string, code: number = 400): Response<ApiResponse> => {
  return res.status(code).json({
    code,
    message,
  });
};

export const serverError = (res: Response, message: string = 'Internal Server Error'): Response<ApiResponse> => {
  return res.status(500).json({
    code: 500,
    message,
  });
};

export default { success, error, serverError };
