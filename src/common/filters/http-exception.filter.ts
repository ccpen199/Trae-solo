import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseUtil, ApiResponse } from '../utils/response.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let result: ApiResponse<unknown>;
    let statusCode: number;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const candidate = exceptionResponse as Record<string, unknown>;
        const message =
          typeof candidate.message === 'string'
            ? candidate.message
            : Array.isArray(candidate.message)
            ? (candidate.message as string[]).join(', ')
            : exception.message;
        result = ResponseUtil.error(statusCode, message, candidate.error ?? null);
      } else {
        result = ResponseUtil.error(statusCode, exception.message);
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      result = ResponseUtil.internalError(exception.message);
      this.logger.error(
        `未处理的异常: ${exception.message}`,
        exception.stack,
      );
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      result = ResponseUtil.internalError('未知错误');
      this.logger.error(`未知异常类型: ${JSON.stringify(exception)}`);
    }

    this.logger.warn(
      `[${request.method}] ${request.url} -> ${statusCode} - ${result.message}`,
    );

    response.status(statusCode).json(result);
  }
}
