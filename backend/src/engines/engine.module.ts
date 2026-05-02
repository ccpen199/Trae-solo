import { Module } from '@nestjs/common';
import { SlotEngineService } from './slot-engine.service';
import { ScheduleConflictEngineService } from './schedule-conflict-engine.service';
import { QueueEngineService } from './queue-engine.service';
import { RefundEngineService } from './refund-engine.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    SlotEngineService,
    ScheduleConflictEngineService,
    QueueEngineService,
    RefundEngineService,
  ],
  exports: [
    SlotEngineService,
    ScheduleConflictEngineService,
    QueueEngineService,
    RefundEngineService,
  ],
})
export class EngineModule {}
