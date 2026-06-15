import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { OpenApiService } from '../open-api.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class ApiSignatureGuard implements CanActivate {
  constructor(
    private openApiService: OpenApiService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const {
      'x-app-id': appId,
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
    } = request.headers;
    if (!appId || !timestamp || !nonce || !signature) {
      throw new UnauthorizedException('缺少签名参数');
    }
    const now = Date.now();
    if (Math.abs(now - parseInt(timestamp)) > 5 * 60 * 1000) {
      throw new UnauthorizedException('请求已过期');
    }
    const bodyStr = JSON.stringify(request.body || {});
    const valid = await this.openApiService.validateSignature(
      appId,
      timestamp,
      nonce,
      signature,
      bodyStr,
    );
    if (!valid) {
      this.logger.warn(`API签名验证失败: app=${appId}`, 'ApiSignatureGuard');
      throw new UnauthorizedException('签名验证失败');
    }
    return true;
  }
}
