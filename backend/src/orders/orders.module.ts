import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StateMachineModule } from '../state-machine/state-machine.module';
import { TrackVerifyEngineModule } from '../engines/track-verify/track-verify-engine.module';
import { BillingEngineModule } from '../engines/billing/billing-engine.module';
import { CreditEngineModule } from '../engines/credit/credit-engine.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DispatchEngineModule } from '../engines/dispatch/dispatch-engine.module';

@Module({
  imports: [
    PrismaModule,
    StateMachineModule,
    TrackVerifyEngineModule,
    BillingEngineModule,
    CreditEngineModule,
    AuditLogModule,
    DispatchEngineModule,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
