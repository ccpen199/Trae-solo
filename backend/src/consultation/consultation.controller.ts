import { Controller, Get, Post, Param, Query, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationService } from './consultation.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('就诊')
@ApiBearerAuth()
@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post('start/:registrationId')
  @Roles('DOCTOR', 'NURSE')
  @Permissions(Permission.CONSULTATION_PROCESS)
  @ApiOperation({ summary: '开始就诊' })
  async startConsultation(
    @Param('registrationId') registrationId: string,
    @Request() req: any,
  ) {
    return this.consultationService.startConsultation(registrationId, req.user.id);
  }

  @Post('complete/:registrationId')
  @Roles('DOCTOR')
  @Permissions(Permission.CONSULTATION_PROCESS)
  @ApiOperation({ summary: '完成就诊' })
  async completeConsultation(
    @Param('registrationId') registrationId: string,
    @Body() data: { notes?: string },
    @Request() req: any,
  ) {
    return this.consultationService.completeConsultation(
      registrationId,
      req.user.id,
      data.notes,
    );
  }

  @Get('ongoing')
  @Roles('DOCTOR', 'NURSE', 'ADMIN')
  @Permissions(Permission.CONSULTATION_VIEW)
  @ApiOperation({ summary: '获取正在进行的就诊' })
  async getOngoingConsultations(@Query('doctorId') doctorId?: string) {
    return this.consultationService.getOngoingConsultations(doctorId);
  }

  @Get('today')
  @Roles('DOCTOR', 'NURSE', 'ADMIN', 'REGISTRAR')
  @Permissions(Permission.CONSULTATION_VIEW)
  @ApiOperation({ summary: '获取今日就诊记录' })
  async getTodayConsultations(@Query('date') date?: string) {
    return this.consultationService.getTodayConsultations(
      date ? new Date(date) : undefined,
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.CONSULTATION_VIEW)
  @ApiOperation({ summary: '获取就诊统计' })
  async getStatistics(@Query('date') date?: string) {
    return this.consultationService.getStatistics(
      date ? new Date(date) : undefined,
    );
  }

  @Get('stats/doctor/:doctorId')
  @Roles('DOCTOR', 'ADMIN')
  @Permissions(Permission.CONSULTATION_VIEW)
  @ApiOperation({ summary: '获取医生就诊统计' })
  async getDoctorStatistics(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.consultationService.getDoctorStatistics(
      doctorId,
      date ? new Date(date) : undefined,
    );
  }
}
