import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user } = request;
    const requestId = request.requestId || 'unknown';
    const userId = user?.userId || 'anonymous';
    const username = user?.username || 'anonymous';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;

          this.logger.log(
            `[${requestId}] ${method} ${url} ${statusCode} - ${userId}:${username} - ${duration}ms`,
          );
        },
        error: (error) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = error.status || 500;
          const duration = Date.now() - now;

          this.logger.error(
            `[${requestId}] ${method} ${url} ${statusCode} - ${userId}:${username} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
