import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlarmsService } from './alarms.service';
import { AlarmsController } from './alarms.controller';
import { Alarm } from './entities/alarm.entity';
import { AlarmAction } from './entities/alarm-action.entity';
import { SensorsModule } from '../sensors/sensors.module';
import { AgronomyModule } from '../agronomy/agronomy.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alarm, AlarmAction]),
    forwardRef(() => SensorsModule),
    forwardRef(() => AgronomyModule),
    AuditModule,
  ],
  providers: [AlarmsService],
  controllers: [AlarmsController],
  exports: [AlarmsService],
})
export class AlarmsModule {}
