import { Module, forwardRef } from '@nestjs/common';
import { FarmGateway } from './farm.gateway';
import { SensorsModule } from '../sensors/sensors.module';
import { AlarmsModule } from '../alarms/alarms.module';
import { ControlModule } from '../control/control.module';

@Module({
  imports: [
    forwardRef(() => SensorsModule),
    forwardRef(() => AlarmsModule),
    forwardRef(() => ControlModule),
  ],
  providers: [FarmGateway],
  exports: [FarmGateway],
})
export class WebsocketModule {}
