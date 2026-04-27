import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { Alarm, AlarmStatus } from './entities/alarm.entity';
import { AlarmAction } from './entities/alarm-action.entity';
import { AuditService } from '../audit/audit.service';
import { AuditResourceType } from '../audit/entities/audit-log.entity';

@Controller('alarms')
export class AlarmsController {
  constructor(
    private readonly alarmsService: AlarmsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('open')
  async getOpenAlarms(): Promise<Alarm[]> {
    return this.alarmsService.getOpenAlarms();
  }

  @Get(':id')
  async getAlarmById(@Param('id') id: string): Promise<Alarm | null> {
    return null;
  }

  @Post('check')
  async checkAndCreateAlarm(
    @Body() body: {
      sensorId: string;
      value: number;
      timestamp?: string;
      cropId?: string;
      growthDay?: number;
    },
  ): Promise<Alarm | null> {
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    const alarm = await this.alarmsService.checkAndCreateAlarm(
      body.sensorId,
      body.value,
      timestamp,
      body.cropId,
      body.growthDay,
    );

    return alarm;
  }

  @Put(':id/acknowledge')
  async acknowledgeAlarm(
    @Param('id') id: string,
    @Body() body: { operatorName: string },
  ): Promise<Alarm> {
    const alarm = await this.alarmsService.acknowledgeAlarm(
      id,
      body.operatorName,
    );

    await this.auditService.logExecute(
      AuditResourceType.ALARM,
      alarm.id,
      alarm.title,
      'acknowledge',
      { fromStatus: AlarmStatus.OPEN, toStatus: alarm.status },
      null,
      body.operatorName,
      null,
      alarm.id,
    );

    return alarm;
  }

  @Put(':id/resolve')
  async resolveAlarm(
    @Param('id') id: string,
    @Body() body: {
      operatorName: string;
      resolutionNotes?: string;
    },
  ): Promise<Alarm> {
    const alarm = await this.alarmsService.resolveAlarm(
      id,
      body.operatorName,
      body.resolutionNotes,
    );

    await this.auditService.logExecute(
      AuditResourceType.ALARM,
      alarm.id,
      alarm.title,
      'resolve',
      {
        fromStatus: AlarmStatus.ACKNOWLEDGED,
        toStatus: alarm.status,
        resolutionNotes: body.resolutionNotes,
      },
      null,
      body.operatorName,
      null,
      alarm.id,
    );

    return alarm;
  }

  @Get(':id/actions')
  async getActionsForAlarm(@Param('id') id: string): Promise<AlarmAction[]> {
    return this.alarmsService.getActionsForAlarm(id);
  }

  @Post('actions/:id/confirm')
  async confirmAction(
    @Param('id') id: string,
    @Body() body: { operatorName: string },
  ): Promise<AlarmAction> {
    const action = await this.alarmsService.confirmAction(id, body.operatorName);

    await this.auditService.logExecute(
      AuditResourceType.ALARM,
      action.alarmId,
      `Action ${action.title}`,
      'confirm_action',
      { actionId: action.id, actionTitle: action.title },
      null,
      body.operatorName,
      null,
      action.alarmId,
    );

    return action;
  }
}
