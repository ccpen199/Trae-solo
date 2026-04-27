import { Module } from '@nestjs/common';
import { RepairOrdersService } from './repair-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StateMachineModule } from '../state-machine/state-machine.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, StateMachineModule, AuditLogModule],
  providers: [RepairOrdersService],
  exports: [RepairOrdersService],
})
export class RepairOrdersModule {}
