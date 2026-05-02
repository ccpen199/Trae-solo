import { Controller, Get, Post, Param, Query, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RefundService } from './refund.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission, RefundReason } from '@hospital/shared';

@ApiTags('退费')
@ApiBearerAuth()
@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post('registration/:registrationId')
  @Roles('REGISTRAR', 'ADMIN', 'PATIENT')
  @Permissions(Permission.REFUND_PROCESS)
  @ApiOperation({ summary: '申请退费' })
  async processRefund(
    @Param('registrationId') registrationId: string,
    @Body() data: { reason: RefundReason; notes?: string },
    @Request() req: any,
  ) {
    return this.refundService.processRefund(
      registrationId,
      data.reason,
      req.user.id,
      data.notes,
    );
  }

  @Post('cancel-appointment/:appointmentId')
  @Roles('PATIENT', 'REGISTRAR', 'ADMIN')
  @Permissions(Permission.REFUND_PROCESS)
  @ApiOperation({ summary: '取消预约（自动退费）' })
  async cancelAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() req: any,
  ) {
    return this.refundService.cancelAppointment(appointmentId, req.user.id);
  }

  @Get()
  @Roles('REGISTRAR', 'ADMIN', 'PATIENT')
  @Permissions(Permission.REFUND_VIEW)
  @ApiOperation({ summary: '获取退费列表' })
  async getRefunds(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.refundService.getRefunds({
      status: status as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      patientId,
    });
  }

  @Get('stats')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.REFUND_VIEW)
  @ApiOperation({ summary: '获取退费统计' })
  async getStatistics(@Query('date') date?: string) {
    return this.refundService.getStatistics(
      date ? new Date(date) : undefined,
    );
  }
}
