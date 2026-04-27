import { Module } from '@nestjs/common';
import { CreditEngineService } from './credit-engine.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CreditEngineService],
  exports: [CreditEngineService],
})
export class CreditEngineModule {}
