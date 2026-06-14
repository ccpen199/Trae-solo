import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [SystemController],
  providers: [SystemService, AuditLogService],
  exports: [SystemService, AuditLogService],
})
export class SystemModule {}
