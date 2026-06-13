import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { AlertService } from './alert.service';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards';
import { AlertType, AlertSeverity, AlertStatus, NotificationChannel } from '@iot/shared';

@ApiTags('Monitoring')
@Controller('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly alertService: AlertService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get('dashboard')
  getHomeDashboard(@Request() req: any) {
    return this.monitoringService.getHomeDashboard(req.user.homeId);
  }

  @Get('admin-dashboard')
  getAdminDashboard(@Request() req: any) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('仅管理员可访问');
    }
    return this.monitoringService.getAdminDashboard();
  }

  @Get('online-rate')
  getOnlineRate(@Request() req: any, @Query('range') range?: any, @Query('homeId') homeId?: string) {
    const targetHome = homeId || req.user.homeId;
    return this.monitoringService.getOnlineRate(targetHome, range);
  }

  @Get('power-analytics')
  getPowerAnalytics(@Request() req: any, @Query('range') range?: any) {
    return this.monitoringService.getPowerAnalytics(req.user.homeId, range);
  }

  @Get('alerts')
  getAlerts(
    @Request() req: any,
    @Query('deviceId') deviceId?: string,
    @Query('type') type?: AlertType,
    @Query('severity') severity?: AlertSeverity,
    @Query('status') status?: AlertStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.alertService.getAlerts(req.user.homeId, {
      deviceId,
      type,
      severity,
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post('alerts/:id/acknowledge')
  acknowledgeAlert(@Param('id') id: string, @Request() req: any) {
    return this.alertService.acknowledge(id, req.user.userId);
  }

  @Post('alerts/:id/resolve')
  resolveAlert(@Param('id') id: string, @Request() req: any, @Body() dto?: { resolutionNote?: string }) {
    return this.alertService.resolve(id, req.user.userId, dto?.resolutionNote);
  }

  @Post('alerts/:id/ignore')
  ignoreAlert(@Param('id') id: string, @Request() req: any) {
    return this.alertService.ignore(id, req.user.userId);
  }

  @Post('alerts/bulk-resolve')
  bulkResolve(@Body() dto: { alertIds: string[] }, @Request() req: any) {
    return this.alertService.bulkResolve(dto.alertIds, req.user.userId);
  }

  @Get('alerts/stats')
  getAlertStats(@Request() req: any, @Query('since') since?: string) {
    const sinceDate = since ? new Date(since) : undefined;
    return this.alertService.getAlertStats(req.user.homeId, sinceDate);
  }

  @Get('notifications')
  getNotifications(@Request() req: any, @Query('limit') limit?: string) {
    return this.notificationService.getUserNotifications(
      req.user.userId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('notifications/send')
  sendCustom(@Request() req: any, @Body() dto: { userIds: string[]; channels: NotificationChannel[]; title: string; content: string; extra?: Record<string, any> }) {
    return this.notificationService.sendCustomNotification(
      dto.userIds,
      dto.channels,
      dto.title,
      dto.content,
      dto.extra,
    );
  }
}
