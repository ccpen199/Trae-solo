import { Controller, Get, Post, Put, Param, Query, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { RegistrationStatus } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('挂号')
@ApiBearerAuth()
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Get()
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.REGISTRATION_VIEW)
  @ApiOperation({ summary: '获取所有挂号列表' })
  async findAll() {
    return this.registrationService.findAll();
  }

  @Get('my')
  @Permissions(Permission.REGISTRATION_VIEW)
  @ApiOperation({ summary: '获取当前用户的挂号记录' })
  async getMyRegistrations(@Request() req: any) {
    return this.registrationService.findByPatient(req.user.id);
  }

  @Get('patient/:patientId')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.REGISTRATION_VIEW)
  @ApiOperation({ summary: '按患者获取挂号记录' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.registrationService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles('ADMIN', 'REGISTRAR', 'DOCTOR', 'NURSE')
  @Permissions(Permission.REGISTRATION_VIEW)
  @ApiOperation({ summary: '按医生获取挂号记录' })
  async findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.registrationService.findByDoctor(
      doctorId,
      date ? new Date(date) : undefined,
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.REGISTRATION_VIEW)
  @ApiOperation({ summary: '获取挂号统计' })
  async getStats(@Query('date') date?: string) {
    return this.registrationService.getStatistics(date ? new Date(date) : undefined);
  }

  @Get(':id')
  @Permissions(Permission.REGISTRATION_VIEW)
  @ApiOperation({ summary: '根据ID获取挂号记录' })
  async findById(@Param('id') id: string) {
    return this.registrationService.findById(id);
  }

  @Post('from-appointment/:appointmentId')
  @Permissions(Permission.REGISTRATION_CREATE)
  @ApiOperation({ summary: '从预约创建挂号' })
  async createFromAppointment(@Param('appointmentId') appointmentId: string) {
    return this.registrationService.createFromAppointment(appointmentId);
  }

  @Post('on-site')
  @Roles('REGISTRAR')
  @Permissions(Permission.REGISTRATION_CREATE)
  @ApiOperation({ summary: '现场挂号' })
  async createOnSite(
    @Body()
    data: {
      patientId: string;
      doctorId: string;
      departmentId: string;
      scheduleId: string;
      slotId: string;
      registrationDate: string;
      fee: number;
      isInsurance?: boolean;
      notes?: string;
    },
  ) {
    return this.registrationService.createOnSite({
      ...data,
      registrationDate: new Date(data.registrationDate),
    });
  }

  @Put(':id/status')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.REGISTRATION_UPDATE)
  @ApiOperation({ summary: '更新挂号状态' })
  async updateStatus(@Param('id') id: string, @Query('status') status: RegistrationStatus) {
    return this.registrationService.updateStatus(id, status);
  }

  @Put(':id/cancel')
  @Permissions(Permission.REGISTRATION_CANCEL)
  @ApiOperation({ summary: '取消挂号' })
  async cancel(@Param('id') id: string, @Request() req: any) {
    return this.registrationService.cancel(id, req.user.id);
  }
}
