import { Module, forwardRef } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StateMachineModule } from '../state-machine/state-machine.module';

@Module({
  imports: [PrismaModule, forwardRef(() => StateMachineModule)],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
