import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        message = (response as { message?: string }).message || exception.message;
        code = (response as { error?: string }).error || 'HTTP_ERROR';
      } else {
        message = response as string;
      }
    } else if (exception instanceof ZodError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = '参数验证失败';
      code = 'VALIDATION_ERROR';
      details = exception.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error('Unhandled exception:', exception.stack);
    }

    const request = ctx.getRequest<Request>();
    this.logger.error(`[${request.method}] ${request.url} - ${message}`, exception);

    const responseBody = {
      success: false,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
