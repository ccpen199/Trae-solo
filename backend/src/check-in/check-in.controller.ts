import { Controller, Get, Post, Param, Query, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckInService } from './check-in.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('签到')
@ApiBearerAuth()
@Controller('check-ins')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post('registration/:registrationId')
  @Roles('NURSE', 'REGISTRAR', 'PATIENT')
  @Permissions(Permission.CHECKIN_PROCESS)
  @ApiOperation({ summary: '签到' })
  async checkIn(
    @Param('registrationId') registrationId: string,
    @Request() req: any,
  ) {
    return this.checkInService.checkIn(registrationId, req.user.id);
  }

  @Post('by-queue-number')
  @Roles('NURSE', 'REGISTRAR')
  @Permissions(Permission.CHECKIN_PROCESS)
  @ApiOperation({ summary: '按队列号签到' })
  async checkInByQueueNumber(
    @Body() data: { doctorId: string; queueNumber: number },
    @Request() req: any,
  ) {
    return this.checkInService.checkInByQueueNumber(
      data.doctorId,
      data.queueNumber,
      req.user.id,
    );
  }

  @Get('today')
  @Roles('NURSE', 'REGISTRAR', 'ADMIN')
  @Permissions(Permission.CHECKIN_VIEW)
  @ApiOperation({ summary: '获取今日签到记录' })
  async getTodayCheckIns(@Query('date') date?: string) {
    return this.checkInService.getTodayCheckIns(date ? new Date(date) : undefined);
  }

  @Get('stats')
  @Roles('NURSE', 'REGISTRAR', 'ADMIN')
  @Permissions(Permission.CHECKIN_VIEW)
  @ApiOperation({ summary: '获取签到统计' })
  async getStatistics(@Query('date') date?: string) {
    return this.checkInService.getStatistics(date ? new Date(date) : undefined);
  }
}
