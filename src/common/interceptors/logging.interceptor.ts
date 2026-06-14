import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  LoggerService,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const now = Date.now();

    this.logger.log(
      `[${request.method}] ${request.url} - IP: ${request.ip}`,
      'LoggingInterceptor',
    );

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        this.logger.log(
          `[${request.method}] ${request.url} -> ${response.statusCode} (${Date.now() - now}ms)`,
          'LoggingInterceptor',
        );
      }),
    );
  }
}
