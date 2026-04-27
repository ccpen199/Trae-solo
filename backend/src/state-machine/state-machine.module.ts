import { Module, forwardRef } from '@nestjs/common';
import { StateMachineService } from './state-machine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuditLogModule)],
  providers: [StateMachineService],
  exports: [StateMachineService],
})
export class StateMachineModule {}
