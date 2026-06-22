import { Response } from 'express';
import { ApiResponse } from '@shared/types';

export const success = <T>(res: Response, data?: T, message = 'success', code = 200) => {
  const result: ApiResponse<T> = {
    code,
    message,
    data,
  };
  return res.status(code).json(result);
};

export const error = (res: Response, message: string, code = 400) => {
  const result: ApiResponse = {
    code,
    message,
  };
  return res.status(code).json(result);
};

export const serverError = (res: Response, message = 'Internal Server Error', code = 500) => {
  const result: ApiResponse = {
    code,
    message,
  };
  return res.status(code).json(result);
};
