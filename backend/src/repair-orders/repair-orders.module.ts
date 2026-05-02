import { Module } from '@nestjs/common';
import { RepairOrdersService } from './repair-orders.service';
import { RepairOrdersController } from './repair-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StateMachineModule } from '../state-machine/state-machine.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, StateMachineModule, AuditLogModule],
  controllers: [RepairOrdersController],
  providers: [RepairOrdersService],
  exports: [RepairOrdersService],
})
export class RepairOrdersModule {}
