import { Module } from '@nestjs/common';
import { ColdChainExceptionController } from './controllers/cold-chain-exception.controller';
import { ColdChainExceptionEngine } from './services/cold-chain-exception-engine.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../../modules/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ColdChainExceptionController],
  providers: [ColdChainExceptionEngine],
  exports: [ColdChainExceptionEngine],
})
export class ColdChainExceptionModule {}
