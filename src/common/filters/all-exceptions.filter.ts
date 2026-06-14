import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 'INTERNAL_ERROR';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'object') {
        message = res.message || exception.message;
        code = res.code || exception.name;
        errors = res.errors || null;
      } else {
        message = res;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name;
      this.logger.error(
        `未捕获异常: ${exception.message}`,
        (exception as any).stack,
        'AllExceptionsFilter',
      );
    }

    this.logger.warn(
      `[${request.method}] ${request.url} -> ${status} ${code}: ${message}`,
      'AllExceptionsFilter',
    );

    response.status(status).json({
      success: false,
      code,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
