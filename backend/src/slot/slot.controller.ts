import { Controller, Get, Post, Put, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlotService } from './slot.service';
import { SlotStatus } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('号源')
@ApiBearerAuth()
@Controller('slots')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Get()
  @Roles('ADMIN')
  @Permissions(Permission.SLOT_VIEW)
  @ApiOperation({ summary: '获取所有号源列表' })
  async findAll() {
    return this.slotService.findAll();
  }

  @Get('schedule/:scheduleId')
  @Permissions(Permission.SLOT_VIEW)
  @ApiOperation({ summary: '按排班获取号源' })
  async findBySchedule(@Param('scheduleId') scheduleId: string) {
    return this.slotService.findBySchedule(scheduleId);
  }

  @Get('schedule/:scheduleId/available')
  @Permissions(Permission.SLOT_VIEW)
  @ApiOperation({ summary: '获取排班的可用号源' })
  async getAvailableBySchedule(@Param('scheduleId') scheduleId: string) {
    return this.slotService.getAvailableBySchedule(scheduleId);
  }

  @Get('stats/schedule/:scheduleId')
  @Permissions(Permission.SLOT_VIEW)
  @ApiOperation({ summary: '获取排班号源统计' })
  async getStatsBySchedule(@Param('scheduleId') scheduleId: string) {
    return this.slotService.getStatsBySchedule(scheduleId);
  }

  @Get('stats/department/:departmentId')
  @Permissions(Permission.SLOT_VIEW)
  @ApiOperation({ summary: '获取科室号源统计' })
  async getStatsByDepartment(
    @Param('departmentId') departmentId: string,
    @Query('date') date?: string,
  ) {
    return this.slotService.getStatsByDepartment(
      departmentId,
      date ? new Date(date) : undefined,
    );
  }

  @Get(':id')
  @Permissions(Permission.SLOT_VIEW)
  @ApiOperation({ summary: '根据ID获取号源' })
  async findById(@Param('id') id: string) {
    return this.slotService.findById(id);
  }

  @Get(':id/availability')
  @Permissions(Permission.SLOT_VIEW)
  @ApiOperation({ summary: '检查号源可用性' })
  async checkAvailability(@Param('id') id: string) {
    return this.slotService.checkAvailability(id);
  }

  @Post(':id/lock')
  @Permissions(Permission.SLOT_LOCK)
  @ApiOperation({ summary: '锁定号源' })
  async lockSlot(@Param('id') id: string, @Request() req: any) {
    return this.slotService.lockSlot(id, req.user.id);
  }

  @Post(':id/release')
  @Permissions(Permission.SLOT_RELEASE)
  @ApiOperation({ summary: '释放号源' })
  async releaseSlot(@Param('id') id: string, @Request() req: any) {
    return this.slotService.releaseSlot(id, req.user.id);
  }

  @Put(':id/status')
  @Roles('ADMIN')
  @Permissions(Permission.SLOT_MANAGE)
  @ApiOperation({ summary: '更新号源状态' })
  async updateStatus(@Param('id') id: string, @Query('status') status: SlotStatus) {
    return this.slotService.updateSlotStatus(id, status);
  }

  @Post('release-expired')
  @Roles('ADMIN')
  @Permissions(Permission.SLOT_MANAGE)
  @ApiOperation({ summary: '释放过期锁定的号源' })
  async releaseExpiredLocks() {
    const count = await this.slotService.releaseExpiredLocks();
    return { message: `释放了 ${count} 个过期锁定的号源` };
  }
}
