import { Module } from '@nestjs/common';
import { GuangdongCloudAdapter } from './adapters/guangdong-cloud.adapter';
import { NationalPlatformAdapter } from './adapters/national-platform.adapter';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  controllers: [IntegrationController],
  providers: [GuangdongCloudAdapter, NationalPlatformAdapter, IntegrationService],
  exports: [GuangdongCloudAdapter, NationalPlatformAdapter, IntegrationService],
})
export class IntegrationModule {}
