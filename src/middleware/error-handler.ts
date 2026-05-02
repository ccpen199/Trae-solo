import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { isAppError, getErrorResponse, ErrorCode } from '../utils/errors';
import logger from '../utils/logger';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('请求处理错误', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (isAppError(error)) {
    res.status(error.statusCode).json(getErrorResponse(error));
    return;
  }

  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: '请求参数验证失败',
        details: {
          validationErrors,
        },
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || ['unknown'];
      res.status(409).json({
        success: false,
        error: {
          code: ErrorCode.CONFLICT,
          message: '数据冲突，该记录已存在',
          details: {
            field: target.join(', '),
          },
        },
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: '记录不存在',
        },
      });
      return;
    }

    if (error.code === 'P2003') {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: '外键约束失败，相关记录不存在',
        },
      });
      return;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: '数据库验证失败',
      },
    });
    return;
  }

  const statusCode = error instanceof SyntaxError && 'status' in error ? (error as { status: number }).status : 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : '服务器内部错误',
    },
  });
}

export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: '请求的资源不存在',
    },
  });
}

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
