import { Controller, Get, Post, Put, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { QueueStatus } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('队列')
@ApiBearerAuth()
@Controller('queues')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @Roles('ADMIN', 'NURSE', 'REGISTRAR')
  @Permissions(Permission.QUEUE_VIEW)
  @ApiOperation({ summary: '获取所有队列' })
  async findAll() {
    return this.queueService.findAll();
  }

  @Get('today')
  @Roles('ADMIN', 'NURSE', 'REGISTRAR', 'DOCTOR')
  @Permissions(Permission.QUEUE_VIEW)
  @ApiOperation({ summary: '获取今日队列概览' })
  async getTodayQueues() {
    return this.queueService.getTodayQueues();
  }

  @Get('doctor/:doctorId')
  @Roles('ADMIN', 'NURSE', 'DOCTOR', 'REGISTRAR')
  @Permissions(Permission.QUEUE_VIEW)
  @ApiOperation({ summary: '按医生获取队列' })
  async getDoctorQueue(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.queueService.getDoctorQueue(
      doctorId,
      date ? new Date(date) : undefined,
    );
  }

  @Get('department/:departmentId')
  @Roles('ADMIN', 'NURSE', 'REGISTRAR')
  @Permissions(Permission.QUEUE_VIEW)
  @ApiOperation({ summary: '按科室获取队列' })
  async getDepartmentQueue(
    @Param('departmentId') departmentId: string,
    @Query('date') date?: string,
  ) {
    return this.queueService.getDepartmentQueue(
      departmentId,
      date ? new Date(date) : undefined,
    );
  }

  @Get('position/:registrationId')
  @Permissions(Permission.QUEUE_VIEW)
  @ApiOperation({ summary: '获取队列位置' })
  async getQueuePosition(@Param('registrationId') registrationId: string) {
    return this.queueService.getQueuePosition(registrationId);
  }

  @Get('stats/:doctorId')
  @Roles('ADMIN', 'NURSE', 'DOCTOR')
  @Permissions(Permission.QUEUE_VIEW)
  @ApiOperation({ summary: '获取队列统计' })
  async getStatistics(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.queueService.getStatistics(
      doctorId,
      date ? new Date(date) : undefined,
    );
  }

  @Get(':id')
  @Permissions(Permission.QUEUE_VIEW)
  @ApiOperation({ summary: '根据ID获取队列项' })
  async findById(@Param('id') id: string) {
    return this.queueService.findById(id);
  }

  @Post('add')
  @Roles('NURSE', 'REGISTRAR')
  @Permissions(Permission.QUEUE_MANAGE)
  @ApiOperation({ summary: '加入队列' })
  async addToQueue(
    @Body()
    data: {
      registrationId: string;
      doctorId: string;
      departmentId: string;
      isPriority?: boolean;
      priorityReason?: string;
    },
  ) {
    return this.queueService.addToQueue(
      data.registrationId,
      data.doctorId,
      data.departmentId,
      data.isPriority,
      data.priorityReason,
    );
  }

  @Post('call-next')
  @Roles('NURSE', 'DOCTOR')
  @Permissions(Permission.QUEUE_CALL)
  @ApiOperation({ summary: '叫下一位患者' })
  async callNextPatient(
    @Body() data: { doctorId: string },
    @Request() req: any,
  ) {
    return this.queueService.callNextPatient(data.doctorId, req.user.id);
  }

  @Post('call/:id')
  @Roles('NURSE', 'DOCTOR')
  @Permissions(Permission.QUEUE_CALL)
  @ApiOperation({ summary: '叫指定患者' })
  async callSpecificPatient(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.queueService.callSpecificPatient(id, req.user.id);
  }

  @Post('skip/:id')
  @Roles('NURSE', 'DOCTOR')
  @Permissions(Permission.QUEUE_MANAGE)
  @ApiOperation({ summary: '跳过患者' })
  async skipPatient(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.queueService.skipPatient(id, req.user.id);
  }

  @Post('start-consultation/:id')
  @Roles('NURSE', 'DOCTOR')
  @Permissions(Permission.CONSULTATION_PROCESS)
  @ApiOperation({ summary: '开始就诊' })
  async startConsultation(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.queueService.startConsultation(id, req.user.id);
  }

  @Post('complete-consultation/:id')
  @Roles('DOCTOR')
  @Permissions(Permission.CONSULTATION_PROCESS)
  @ApiOperation({ summary: '完成就诊' })
  async completeConsultation(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.queueService.completeConsultation(id, req.user.id);
  }

  @Put(':id/status')
  @Roles('ADMIN')
  @Permissions(Permission.QUEUE_MANAGE)
  @ApiOperation({ summary: '更新队列状态' })
  async updateStatus(
    @Param('id') id: string,
    @Query('status') status: QueueStatus,
  ) {
    return this.queueService.updateStatus(id, status);
  }
}
