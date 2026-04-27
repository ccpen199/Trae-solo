import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControlService } from './control.service';
import { ControlController } from './control.controller';
import { ControlDevice } from './entities/control-device.entity';
import { ControlCommand } from './entities/control-command.entity';
import { SensorsModule } from '../sensors/sensors.module';
import { AgronomyModule } from '../agronomy/agronomy.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ControlDevice, ControlCommand]),
    forwardRef(() => SensorsModule),
    forwardRef(() => AgronomyModule),
    AuditModule,
  ],
  providers: [ControlService],
  controllers: [ControlController],
  exports: [ControlService],
})
export class ControlModule {}
