import { Module } from '@nestjs/common';
import { DispatchEngineService } from './dispatch-engine.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DispatchEngineService],
  exports: [DispatchEngineService],
})
export class DispatchEngineModule {}
