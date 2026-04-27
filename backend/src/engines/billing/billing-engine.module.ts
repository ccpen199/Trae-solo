import { Module } from '@nestjs/common';
import { BillingEngineService } from './billing-engine.service';

@Module({
  providers: [BillingEngineService],
  exports: [BillingEngineService],
})
export class BillingEngineModule {}
