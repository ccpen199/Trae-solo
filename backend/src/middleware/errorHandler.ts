import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import config from '../config';

export class AppError extends Error {
  public code: number;
  public statusCode: number;
  public errorCode?: string;
  public details?: unknown;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    options?: { errorCode?: string; details?: unknown; isOperational?: boolean }
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = statusCode;
    this.errorCode = options?.errorCode;
    this.details = options?.details;
    this.isOperational = options?.isOperational !== false;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: `请求的资源不存在: ${req.method} ${req.originalUrl}`,
    requestId: (req as any).requestId,
    timestamp: new Date().toISOString(),
    docs: `${config.apiPrefix}/docs`
  });
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).requestId;

  if (error instanceof AppError && error.isOperational) {
    logger.warn('[ErrorHandler] 业务错误:', {
      requestId,
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      path: req.originalUrl
    });

    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      errorCode: error.errorCode,
      details: config.isDev ? error.details : undefined,
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  const validationError = (error as any).name === 'ValidationError' ||
    (error as any).name === 'SequelizeValidationError' ||
    (error as any).isJoi;

  if (validationError) {
    logger.warn('[ErrorHandler] 参数验证错误:', {
      requestId,
      message: error.message,
      details: (error as any).details || (error as any).errors
    });

    return res.status(400).json({
      code: 400,
      message: '请求参数验证失败',
      errorCode: 'VALIDATION_ERROR',
      details: config.isDev ? ((error as any).details || (error as any).errors) : undefined,
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  if ((error as any).type === 'entity.parse.failed') {
    return res.status(400).json({
      code: 400,
      message: '请求体JSON格式错误',
      errorCode: 'INVALID_JSON',
      requestId,
      timestamp: new Date().toISOString()
    });
  }

  logger.error('[ErrorHandler] 未处理异常:', {
    requestId,
    error: error.message,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method
  });

  res.status(500).json({
    code: 500,
    message: config.isProd
      ? '服务器内部错误，请稍后重试或联系技术支持'
      : error.message,
    errorCode: 'INTERNAL_SERVER_ERROR',
    requestId,
    timestamp: new Date().toISOString(),
    ...(config.isDev && { stack: error.stack?.split('\n') })
  });
};
