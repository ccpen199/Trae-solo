import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('统计报表')
@ApiBearerAuth()
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'REGISTRAR', 'DOCTOR', 'NURSE')
  @Permissions(Permission.STATISTICS_VIEW)
  @ApiOperation({ summary: '获取仪表盘统计' })
  async getDashboardStats(@Query('date') date?: string) {
    return this.statisticsService.getDashboardStats(
      date ? new Date(date) : undefined,
    );
  }

  @Get('departments')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.STATISTICS_VIEW)
  @ApiOperation({ summary: '获取科室统计' })
  async getDepartmentStats(@Query('date') date?: string) {
    return this.statisticsService.getDepartmentStats(
      date ? new Date(date) : undefined,
    );
  }

  @Get('doctors/:doctorId')
  @Roles('ADMIN', 'DOCTOR')
  @Permissions(Permission.STATISTICS_VIEW)
  @ApiOperation({ summary: '获取医生统计' })
  async getDoctorStats(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.statisticsService.getDoctorStats(
      doctorId,
      date ? new Date(date) : undefined,
    );
  }
}
