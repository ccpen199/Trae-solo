import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
