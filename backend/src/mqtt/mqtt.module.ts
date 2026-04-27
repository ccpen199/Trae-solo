import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorsModule } from '../sensors/sensors.module';
import { AlarmsModule } from '../alarms/alarms.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    forwardRef(() => SensorsModule),
    forwardRef(() => AlarmsModule),
    forwardRef(() => WebsocketModule),
    forwardRef(() => AuditModule),
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
