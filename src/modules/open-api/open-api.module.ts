import { Module, Global } from '@nestjs/common';
import { OpenApiController } from './open-api.controller';
import { OpenApiService } from './open-api.service';
import { ApiSignatureGuard } from './guards/api-signature.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Global()
@Module({
  controllers: [OpenApiController],
  providers: [OpenApiService, ApiSignatureGuard, RateLimitGuard],
  exports: [OpenApiService],
})
export class OpenApiModule {}
