import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('统计')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get('dashboard/overview')
  @ApiOperation({ summary: '仪表盘总览数据' })
  async getDashboardOverview() {
    return this.analyticsService.getDashboardOverview();
  }

  @Public()
  @Get('hot-items')
  @ApiOperation({ summary: '高频服务事项热力排行' })
  async getHotItems(@Query('limit') limit?: number, @Query('days') days?: number) {
    return this.analyticsService.getHotServiceItems(limit, days);
  }

  @Public()
  @Get('application-trend')
  @ApiOperation({ summary: '办件趋势分析' })
  async getTrend(@Query('days') days?: number) {
    return this.analyticsService.getApplicationTrend(days);
  }

  @Public()
  @Get('bottleneck')
  @ApiOperation({ summary: '堵点分析' })
  async getBottleneck() {
    return this.analyticsService.getBottleneckAnalysis();
  }

  @Public()
  @Get('department-performance')
  @ApiOperation({ summary: '部门绩效分析' })
  async getDeptPerformance(@Query('days') days?: number) {
    return this.analyticsService.getDepartmentPerformance(days);
  }

  @Public()
  @Get('region-heatmap')
  @ApiOperation({ summary: '区域热力图数据' })
  async getRegionHeatmap(@Query('days') days?: number) {
    return this.analyticsService.getRegionHeatmap(days);
  }
}
