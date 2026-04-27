import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { SensorsModule } from '../sensors/sensors.module';
import { AlarmsModule } from '../alarms/alarms.module';
import { ControlModule } from '../control/control.module';
import { AgronomyModule } from '../agronomy/agronomy.module';
import { AuditModule } from '../audit/audit.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    SensorsModule,
    AlarmsModule,
    ControlModule,
    AgronomyModule,
    AuditModule,
    WebsocketModule,
  ],
  controllers: [TestController],
  providers: [TestService],
})
export class TestModule {}
