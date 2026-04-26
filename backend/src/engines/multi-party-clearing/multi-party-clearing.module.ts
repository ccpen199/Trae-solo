import { Module } from '@nestjs/common';
import { MultiPartyClearingController } from './controllers/multi-party-clearing.controller';
import { MultiPartyClearingEngine } from './services/multi-party-clearing-engine.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../../modules/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [MultiPartyClearingController],
  providers: [MultiPartyClearingEngine],
  exports: [MultiPartyClearingEngine],
})
export class MultiPartyClearingModule {}
