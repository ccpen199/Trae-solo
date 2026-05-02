import { Module } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EngineModule } from '../engines/engine.module';

@Module({
  imports: [PrismaModule, EngineModule],
  controllers: [CheckInController],
  providers: [CheckInService],
  exports: [CheckInService],
})
export class CheckInModule {}
