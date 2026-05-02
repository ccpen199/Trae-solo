import { Module } from '@nestjs/common';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EngineModule } from '../engines/engine.module';

@Module({
  imports: [PrismaModule, EngineModule],
  controllers: [SlotController],
  providers: [SlotService],
  exports: [SlotService],
})
export class SlotModule {}
