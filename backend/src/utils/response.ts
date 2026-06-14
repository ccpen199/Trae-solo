import { Response } from "express";

interface SuccessResponse<T> {
  ok: true;
  data?: T;
  message?: string;
}

interface ErrorResponse {
  ok: false;
  message: string;
  code?: number;
  details?: unknown;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export const success = <T>(res: Response, data?: T, message?: string, statusCode = 200): Response => {
  return res.status(statusCode).json({
    ok: true,
    data,
    message,
  });
};

export const error = (
  res: Response,
  code: string,
  message: string,
  details?: unknown,
  statusCode = 400
): Response => {
  return res.status(statusCode).json({
    ok: false,
    message,
    code: statusCode,
    details,
  });
};

export const unauthorized = (res: Response, message = "未授权访问"): Response => {
  return error(res, "UNAUTHORIZED", message, undefined, 401);
};

export const forbidden = (res: Response, message = "禁止访问"): Response => {
  return error(res, "FORBIDDEN", message, undefined, 403);
};

export const notFound = (res: Response, message = "资源不存在"): Response => {
  return error(res, "NOT_FOUND", message, undefined, 404);
};

export const internalError = (res: Response, message = "服务器内部错误", details?: unknown): Response => {
  return error(res, "INTERNAL_ERROR", message, details, 500);
};
