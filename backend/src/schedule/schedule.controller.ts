import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { ScheduleType } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('排班')
@ApiBearerAuth()
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @Permissions(Permission.SCHEDULE_VIEW)
  @ApiOperation({ summary: '获取所有排班列表' })
  async findAll() {
    return this.scheduleService.findAll();
  }

  @Get('available')
  @Permissions(Permission.SCHEDULE_VIEW)
  @ApiOperation({ summary: '获取可预约的排班' })
  async getAvailable(
    @Query('departmentId') departmentId: string,
    @Query('doctorId') doctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.getAvailableSchedules(
      departmentId,
      doctorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.SCHEDULE_VIEW)
  @ApiOperation({ summary: '获取排班统计' })
  async getStats(@Query('date') date?: string) {
    return this.scheduleService.getStatistics(date ? new Date(date) : undefined);
  }

  @Get('doctor/:doctorId')
  @Permissions(Permission.SCHEDULE_VIEW)
  @ApiOperation({ summary: '按医生获取排班' })
  async findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.findByDoctor(
      doctorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('department/:departmentId')
  @Permissions(Permission.SCHEDULE_VIEW)
  @ApiOperation({ summary: '按科室获取排班' })
  async findByDepartment(
    @Param('departmentId') departmentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.findByDepartment(
      departmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @Permissions(Permission.SCHEDULE_VIEW)
  @ApiOperation({ summary: '根据ID获取排班' })
  async findById(@Param('id') id: string) {
    return this.scheduleService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @Permissions(Permission.SCHEDULE_CREATE)
  @ApiOperation({ summary: '创建排班' })
  async create(
    @Body()
    data: {
      doctorId: string;
      departmentId: string;
      date: string;
      type: ScheduleType;
      startTime: string;
      endTime: string;
      totalSlots: number;
      roomNumber?: string;
    },
  ) {
    return this.scheduleService.create({
      ...data,
      date: new Date(data.date),
    });
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions(Permission.SCHEDULE_UPDATE)
  @ApiOperation({ summary: '更新排班' })
  async update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      date: string;
      type: ScheduleType;
      startTime: string;
      endTime: string;
      totalSlots: number;
      roomNumber: string;
      isActive: boolean;
    }>,
  ) {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    return this.scheduleService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions(Permission.SCHEDULE_DELETE)
  @ApiOperation({ summary: '删除排班' })
  async delete(@Param('id') id: string) {
    await this.scheduleService.delete(id);
    return { message: '删除成功' };
  }

  @Put(':id/soft-delete')
  @Roles('ADMIN')
  @Permissions(Permission.SCHEDULE_UPDATE)
  @ApiOperation({ summary: '软删除排班' })
  async softDelete(@Param('id') id: string) {
    return this.scheduleService.softDelete(id);
  }
}
