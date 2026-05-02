import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { Table } from './entities/table.entity';
import { TableStatus, TableZone, UserRole } from '../common/types';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('桌台')
@ApiBearerAuth()
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '创建桌台' })
  async createTable(
    @Body()
    tableData: {
      tableNumber: string;
      capacity?: number;
      zone?: TableZone;
      position?: { x: number; y: number; floor: number };
      sortOrder?: number;
    },
  ): Promise<Table> {
    return this.tablesService.createTable(tableData);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '获取所有桌台' })
  async getAllTables(): Promise<Table[]> {
    return this.tablesService.getAllTables();
  }

  @Get('status/summary')
  @ApiOperation({ summary: '获取桌台状态统计' })
  async getTableStatusSummary(): Promise<{
    total: number;
    vacant: number;
    occupied: number;
    cleaning: number;
    reserved: number;
  }> {
    return this.tablesService.getTableStatusSummary();
  }

  @Get('zone/:zone')
  @ApiOperation({ summary: '按区域获取桌台' })
  async getTablesByZone(
    @Param('zone') zone: TableZone,
  ): Promise<Table[]> {
    return this.tablesService.getTablesByZone(zone);
  }

  @Get('status/:status')
  @ApiOperation({ summary: '按状态获取桌台' })
  async getTablesByStatus(
    @Param('status') status: TableStatus,
  ): Promise<Table[]> {
    return this.tablesService.getTablesByStatus(status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取桌台详情' })
  async getTableById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Table> {
    return this.tablesService.getTableById(id);
  }

  @Public()
  @Get('number/:tableNumber')
  @ApiOperation({ summary: '根据桌号获取桌台' })
  async getTableByNumber(
    @Param('tableNumber') tableNumber: string,
  ): Promise<Table> {
    return this.tablesService.getTableByNumber(tableNumber);
  }

  @Post('bulk')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '批量创建桌台' })
  async bulkCreateTables(
    @Body()
    tables: Array<{
      tableNumber: string;
      capacity?: number;
      zone?: TableZone;
      sortOrder?: number;
    }>,
  ): Promise<Table[]> {
    return this.tablesService.bulkCreateTables(tables);
  }

  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '更新桌台信息' })
  async updateTable(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<Table>,
  ): Promise<Table> {
    return this.tablesService.updateTable(id, updates);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '删除桌台' })
  async deleteTable(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tablesService.deleteTable(id);
  }

  @Post(':id/occupy')
  @Roles(UserRole.WAITER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '占用桌台' })
  async occupyTable(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('guestCount') guestCount: number,
    @Request() req,
  ): Promise<Table> {
    return this.tablesService.occupyTable(
      id,
      req.user.id,
      guestCount || 1,
    );
  }

  @Post(':id/cleaning')
  @Roles(UserRole.WAITER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记为清台' })
  async markTableCleaning(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Table> {
    return this.tablesService.markTableCleaning(id);
  }

  @Post(':id/vacant')
  @Roles(UserRole.WAITER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '标记为空闲' })
  async markTableVacant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Table> {
    return this.tablesService.markTableVacant(id);
  }

  @Post(':id/reserve')
  @Roles(UserRole.WAITER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '预订桌台' })
  async reserveTable(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Table> {
    return this.tablesService.reserveTable(id);
  }

  @Post(':id/cancel-reservation')
  @Roles(UserRole.WAITER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '取消预订' })
  async cancelReservation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Table> {
    return this.tablesService.cancelReservation(id);
  }

  @Public()
  @Get(':id/availability')
  @ApiOperation({ summary: '检查桌台可用性' })
  async checkTableAvailability(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    available: boolean;
    status: TableStatus;
  }> {
    return this.tablesService.checkTableAvailability(id);
  }
}
