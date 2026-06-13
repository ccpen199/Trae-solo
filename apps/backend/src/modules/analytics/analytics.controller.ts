import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Analytics')
@Controller('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly learningService: LearningService,
  ) {}

  @Get('usage-report')
  getUsageReport(@Request() req: any, @Query('range') range?: '7d' | '30d' | '90d') {
    return this.analyticsService.getUsageReport(req.user.homeId, range);
  }

  @Get('device/:deviceId')
  getDeviceAnalytics(@Param('deviceId') deviceId: string, @Request() req: any, @Query('range') range?: '24h' | '7d' | '30d') {
    return this.analyticsService.getDeviceAnalytics(deviceId, req.user.homeId, range);
  }

  @Get('scene-insights')
  getSceneInsights(@Request() req: any) {
    return this.analyticsService.getSceneUsageInsights(req.user.homeId);
  }

  @Get('export')
  exportUserData(@Request() req: any) {
    return this.analyticsService.exportUserData(req.user.homeId);
  }

  @Get('learning/suggestions')
  getSuggestions(@Request() req: any) {
    return this.learningService.getSuggestions(req.user.homeId);
  }

  @Post('learning/apply/:sceneId')
  applyOptimization(
    @Param('sceneId') sceneId: string,
    @Request() req: any,
    @Body() dto: { optimization: any },
  ) {
    return this.learningService.applyOptimization(req.user.userId, sceneId, dto.optimization);
  }

  @Post('learning/create-scene')
  createSceneFromSuggestion(@Request() req: any, @Body() dto: { suggestion: any }) {
    return this.learningService.createSceneFromSuggestion(req.user.userId, req.user.homeId, dto.suggestion);
  }

  @Get('learning/habits')
  getHabitsReport(@Request() req: any) {
    return this.learningService.getHabitsReport(req.user.homeId);
  }

  @Post('behavior/log')
  logBehavior(
    @Request() req: any,
    @Body() dto: {
      action: string;
      deviceId?: string;
      sceneId?: string;
      extra?: Record<string, any>;
    },
  ) {
    return this.analyticsService.logBehavior(req.user.userId, dto.action, {
      homeId: req.user.homeId,
      deviceId: dto.deviceId,
      sceneId: dto.sceneId,
      extra: dto.extra,
    });
  }
}
