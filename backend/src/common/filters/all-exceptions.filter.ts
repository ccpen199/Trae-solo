import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const requestId = request.requestId || 'unknown';

    const httpStatus = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : null;

    let message = '服务器内部错误';
    let details: any = null;

    if (exception instanceof Error) {
      message = exception.message;
    }

    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, any>;
      if (responseObj.message) {
        message = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : responseObj.message;
      }
      if (responseObj.errors) {
        details = responseObj.errors;
      }
      if (responseObj.error) {
        message = message || responseObj.error;
      }
    }

    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} ${httpStatus} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const responseBody = {
      success: false,
      error: {
        code: this.getErrorCode(httpStatus),
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private getErrorCode(status: number): string {
    const errorCodeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
    };

    return errorCodeMap[status] || 'UNKNOWN_ERROR';
  }
}
