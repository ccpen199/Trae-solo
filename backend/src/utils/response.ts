import { ApiResponse } from '../types';

export const successResponse = <T>(data: T, message = '操作成功'): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    code: 200
  };
};

export const errorResponse = (message: string, code = 400): ApiResponse => {
  return {
    success: false,
    message,
    code
  };
};

export const unauthorizedResponse = (message = '未授权，请先登录'): ApiResponse => {
  return {
    success: false,
    message,
    code: 401
  };
};

export const notFoundResponse = (message = '资源不存在'): ApiResponse => {
  return {
    success: false,
    message,
    code: 404
  };
};

export const serverErrorResponse = (message = '服务器内部错误'): ApiResponse => {
  return {
    success: false,
    message,
    code: 500
  };
};
