import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ResponseUtil } from '../utils/response.util';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (this.isApiResponse(data)) {
          return {
            ...data,
            timestamp: Date.now(),
          };
        }
        return ResponseUtil.success(data);
      }),
    );
  }

  private isApiResponse(obj: unknown): obj is ApiResponse<unknown> {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    const candidate = obj as Record<string, unknown>;
    return (
      typeof candidate.code === 'number' &&
      typeof candidate.message === 'string' &&
      'data' in candidate
    );
  }
}
