import { Module } from '@nestjs/common';
import { DemandsService } from './demands.service';
import { DemandsController } from './demands.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StateMachineModule } from '../state-machine/state-machine.module';
import { DispatchEngineModule } from '../engines/dispatch/dispatch-engine.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, StateMachineModule, DispatchEngineModule, AuditLogModule],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}
