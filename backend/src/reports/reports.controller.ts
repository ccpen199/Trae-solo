import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, DailyReport, RevenueReport, MenuReport, TableReport, MemberReport } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types';

@ApiTags('报表')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取仪表盘数据' })
  async getDashboardData(): Promise<{
    todayRevenue: number;
    todayOrders: number;
    averageOrderValue: number;
    tableUtilization: number;
    topItems: Array<{ name: string; quantity: number }>;
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      status: string;
      createdAt: Date;
    }>;
  }> {
    return this.reportsService.getDashboardData();
  }

  @Get('daily')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取日报表' })
  @ApiQuery({ name: 'date', required: false, description: '日期 (YYYY-MM-DD)' })
  async getDailyReport(
    @Query('date') date?: string,
  ): Promise<DailyReport> {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.reportsService.getDailyReport(reportDate);
  }

  @Get('revenue')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取营收报表' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getRevenueReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<RevenueReport> {
    return this.reportsService.getRevenueReport(dateFrom, dateTo);
  }

  @Get('menu')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取菜品报表' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getMenuReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<MenuReport> {
    return this.reportsService.getMenuReport(dateFrom, dateTo);
  }

  @Get('table')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取桌台报表' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getTableReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<TableReport> {
    return this.reportsService.getTableReport(dateFrom, dateTo);
  }

  @Get('member')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取会员报表' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getMemberReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<MemberReport> {
    return this.reportsService.getMemberReport(dateFrom, dateTo);
  }
}
