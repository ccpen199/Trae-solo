import { Request, Response, NextFunction } from "express";
import { error as errorResponse, internalError } from "../utils/response";
import logger from "../utils/logger";

class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, code: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("请求错误", {
    url: req.url,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    errorResponse(res, err.code, err.message, err.details, err.statusCode);
    return;
  }

  if (err.name === "ZodError") {
    errorResponse(res, "VALIDATION_ERROR", "参数验证失败", err.message, 400);
    return;
  }

  if (err.name === "JsonWebTokenError") {
    errorResponse(res, "INVALID_TOKEN", "无效的令牌", undefined, 401);
    return;
  }

  if (err.name === "TokenExpiredError") {
    errorResponse(res, "TOKEN_EXPIRED", "令牌已过期", undefined, 401);
    return;
  }

  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as unknown as { code: string; meta?: unknown };
    if (prismaError.code === "P2002") {
      errorResponse(res, "DUPLICATE_ENTRY", "数据已存在", prismaError.meta, 409);
      return;
    }
    if (prismaError.code === "P2025") {
      errorResponse(res, "NOT_FOUND", "记录不存在", prismaError.meta, 404);
      return;
    }
  }

  internalError(res, "服务器内部错误", err.message);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, "NOT_FOUND", `接口不存在: ${req.method} ${req.url}`, undefined, 404);
};

export { AppError };
