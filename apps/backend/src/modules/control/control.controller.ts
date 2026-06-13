import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ControlService } from './control.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Control')
@Controller('control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  @Post(':deviceId/command')
  sendCommand(
    @Param('deviceId') deviceId: string,
    @Request() req: any,
    @Body() dto: { command: string; params?: Record<string, any>; timeoutMs?: number },
  ) {
    return this.controlService.sendCommand(req.user.userId, deviceId, dto.command, dto.params, dto.timeoutMs);
  }

  @Post('batch')
  batchControl(@Request() req: any, @Body() dto: { commands: any[] }) {
    return this.controlService.batchControl(req.user.userId, dto.commands);
  }

  @Post(':deviceId/delay')
  delayControl(
    @Param('deviceId') deviceId: string,
    @Request() req: any,
    @Body() dto: { command: string; params: Record<string, any>; delayMs: number },
  ) {
    return this.controlService.delayControl(req.user.userId, deviceId, dto.command, dto.params, dto.delayMs);
  }

  @Post('schedule')
  scheduleControl(@Request() req: any, @Body() dto: any) {
    return this.controlService.scheduleControl(req.user.userId, { ...dto, homeId: req.user.homeId });
  }

  @Get('schedule')
  getSchedules(@Request() req: any, @Query('deviceId') deviceId?: string) {
    return this.controlService.getScheduleTasks(req.user.homeId, deviceId);
  }

  @Patch('schedule/:taskId/toggle')
  toggleSchedule(@Param('taskId') taskId: string, @Body() dto: { enabled: boolean }) {
    return this.controlService.toggleScheduleTask(taskId, dto.enabled);
  }

  @Delete('schedule/:taskId')
  deleteSchedule(@Param('taskId') taskId: string) {
    return this.controlService.deleteScheduleTask(taskId);
  }

  @Get(':deviceId/history')
  getCommandHistory(@Param('deviceId') deviceId: string, @Query() q: any) {
    return this.controlService.getCommandHistory(deviceId, +q.page, +q.pageSize);
  }
}
