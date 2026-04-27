import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ControlService } from './control.service';
import { ControlDevice, DeviceStatus } from './entities/control-device.entity';
import { ControlCommand } from './entities/control-command.entity';
import { AuditService } from '../audit/audit.service';
import { AuditResourceType } from '../audit/entities/audit-log.entity';

@Controller('control')
export class ControlController {
  constructor(
    private readonly controlService: ControlService,
    private readonly auditService: AuditService,
  ) {}

  @Get('devices/:id')
  async getDeviceById(@Param('id') id: string): Promise<ControlDevice> {
    return this.controlService.getDeviceById(id);
  }

  @Get('devices')
  async getDevices(
    @Query('zone') zone?: string,
  ): Promise<ControlDevice[]> {
    if (zone) {
      return this.controlService.getDevicesInZone(zone);
    }
    return this.controlService.getAllDevices();
  }

  @Post('devices')
  async createDevice(
    @Body() deviceData: Partial<ControlDevice>,
    @Query('operatorId') operatorId?: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<ControlDevice> {
    const device = await this.controlService.createDevice(deviceData);

    await this.auditService.logCreate(
      AuditResourceType.CONTROL_DEVICE,
      device.id,
      device.name,
      { ...device },
      operatorId,
      operatorName,
    );

    return device;
  }

  @Post('pid-control')
  async executePidControl(
    @Body() body: {
      deviceId: string;
      targetValue?: number;
      cropId?: string;
      growthDay?: number;
      operatorName?: string;
    },
  ): Promise<ControlCommand> {
    const command = await this.controlService.calculateAndExecutePidControl(
      body.deviceId,
      body.targetValue,
      body.cropId,
      body.growthDay,
      body.operatorName,
    );

    await this.auditService.logCreate(
      AuditResourceType.CONTROL_COMMAND,
      command.id,
      command.commandType,
      { ...command },
      null,
      body.operatorName,
    );

    return command;
  }

  @Post('manual-control')
  async executeManualControl(
    @Body() body: {
      deviceId: string;
      targetValue: number;
      operatorName: string;
      reason?: string;
      durationSeconds?: number;
    },
  ): Promise<ControlCommand> {
    const command = await this.controlService.createManualCommand(
      body.deviceId,
      body.targetValue,
      body.operatorName,
      body.reason,
      body.durationSeconds,
    );

    await this.auditService.logCreate(
      AuditResourceType.CONTROL_COMMAND,
      command.id,
      command.commandType,
      { ...command },
      null,
      body.operatorName,
    );

    return command;
  }

  @Get('commands')
  async getPendingCommands(): Promise<ControlCommand[]> {
    return this.controlService.getPendingCommands();
  }

  @Get('devices/:id/commands')
  async getCommandsForDevice(
    @Param('id') id: string,
    @Query('limit') limit: number = 20,
  ): Promise<ControlCommand[]> {
    return this.controlService.getCommandsForDevice(id, limit);
  }

  @Post('devices/:id/status')
  async updateDeviceStatus(
    @Param('id') id: string,
    @Body() body: { status: DeviceStatus; operatorName?: string },
  ): Promise<ControlDevice> {
    const device = await this.controlService.updateDeviceStatus(id, body.status);

    await this.auditService.logExecute(
      AuditResourceType.CONTROL_DEVICE,
      device.id,
      device.name,
      'update_status',
      { status: body.status },
      null,
      body.operatorName,
    );

    return device;
  }

  @Post('devices/:id/reset-pid')
  async resetPidState(
    @Param('id') id: string,
    @Query('operatorName') operatorName?: string,
  ): Promise<{ success: boolean }> {
    this.controlService.resetPidState(id);

    await this.auditService.logExecute(
      AuditResourceType.CONTROL_DEVICE,
      id,
      `Device ${id}`,
      'reset_pid',
      {},
      null,
      operatorName,
    );

    return { success: true };
  }
}
