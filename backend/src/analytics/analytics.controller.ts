import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DistributionChannel, UserRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardMetrics(
    @Query('days') days: number = 7,
    @Request() req?,
  ) {
    return this.analyticsService.getDashboardMetrics(req.user.id, req.user.role, days);
  }

  @Get('content/:contentId')
  async getContentMetrics(
    @Param('contentId') contentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('channel') channel?: DistributionChannel,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getContentMetrics(contentId, start, end, channel);
  }

  @Get('report')
  @Roles(UserRole.DATA_ANALYST, UserRole.CHIEF_EDITOR, UserRole.ADMIN)
  async generateInteractionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.generateInteractionReport(req.user.id, req.user.role, start, end);
  }

  @Post('sample-data')
  @Roles(UserRole.ADMIN)
  async collectSampleData() {
    return this.analyticsService.collectSampleData();
  }
}
