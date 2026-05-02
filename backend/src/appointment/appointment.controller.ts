import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { AppointmentStatus } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('预约')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.APPOINTMENT_VIEW)
  @ApiOperation({ summary: '获取所有预约列表' })
  async findAll() {
    return this.appointmentService.findAll();
  }

  @Get('my')
  @Permissions(Permission.APPOINTMENT_VIEW)
  @ApiOperation({ summary: '获取当前用户的预约' })
  async getMyAppointments(@Request() req: any) {
    return this.appointmentService.findByPatient(req.user.id);
  }

  @Get('patient/:patientId')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.APPOINTMENT_VIEW)
  @ApiOperation({ summary: '按患者获取预约' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @Roles('ADMIN', 'REGISTRAR', 'DOCTOR')
  @Permissions(Permission.APPOINTMENT_VIEW)
  @ApiOperation({ summary: '按医生获取预约' })
  async findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentService.findByDoctor(
      doctorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.APPOINTMENT_VIEW)
  @ApiOperation({ summary: '获取预约统计' })
  async getStats(@Query('date') date?: string) {
    return this.appointmentService.getStatistics(date ? new Date(date) : undefined);
  }

  @Get(':id')
  @Permissions(Permission.APPOINTMENT_VIEW)
  @ApiOperation({ summary: '根据ID获取预约' })
  async findById(@Param('id') id: string) {
    return this.appointmentService.findById(id);
  }

  @Post()
  @Permissions(Permission.APPOINTMENT_CREATE)
  @ApiOperation({ summary: '创建预约' })
  async create(
    @Body()
    data: {
      doctorId: string;
      departmentId: string;
      scheduleId: string;
      slotId: string;
      appointmentDate: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    return this.appointmentService.create({
      ...data,
      patientId: req.user.id,
      appointmentDate: new Date(data.appointmentDate),
    });
  }

  @Put(':id/cancel')
  @Permissions(Permission.APPOINTMENT_CANCEL)
  @ApiOperation({ summary: '取消预约' })
  async cancel(
    @Param('id') id: string,
    @Body() data: { cancelReason: string },
    @Request() req: any,
  ) {
    return this.appointmentService.cancel(id, data.cancelReason, req.user.id);
  }

  @Put(':id/status')
  @Roles('ADMIN')
  @Permissions(Permission.APPOINTMENT_UPDATE)
  @ApiOperation({ summary: '更新预约状态' })
  async updateStatus(@Param('id') id: string, @Query('status') status: AppointmentStatus) {
    return this.appointmentService.updateStatus(id, status);
  }
}
