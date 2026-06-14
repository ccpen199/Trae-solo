import { Injectable, CanActivate, ExecutionContext, Inject, LoggerService, HttpException, HttpStatus } from '@nestjs/common';
import { OpenApiService } from '../open-api.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private openApiService: OpenApiService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const appId = request.headers['x-app-id'];
    if (!appId) return true;
    const allowed = await this.openApiService.checkRateLimit(appId);
    if (!allowed) {
      this.logger.warn(`API限流触发: app=${appId}`, 'RateLimitGuard');
      throw new HttpException('请求频率超过限制', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
