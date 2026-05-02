import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EngineModule } from '../engines/engine.module';

@Module({
  imports: [PrismaModule, EngineModule],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
