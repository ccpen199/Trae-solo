import { Controller, Get, Post, Put, Param, Query, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentStatus, PaymentMethod } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '@hospital/shared';

@ApiTags('支付')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: '获取所有支付记录' })
  async findAll() {
    return this.paymentService.findAll();
  }

  @Get('my')
  @Permissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: '获取当前用户的支付记录' })
  async getMyPayments(@Request() req: any) {
    return this.paymentService.findByPatient(req.user.id);
  }

  @Get('patient/:patientId')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: '按患者获取支付记录' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.paymentService.findByPatient(patientId);
  }

  @Get('stats')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: '获取支付统计' })
  async getStats(@Query('date') date?: string) {
    return this.paymentService.getStatistics(date ? new Date(date) : undefined);
  }

  @Get(':id')
  @Permissions(Permission.PAYMENT_VIEW)
  @ApiOperation({ summary: '根据ID获取支付记录' })
  async findById(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }

  @Post()
  @Permissions(Permission.PAYMENT_PROCESS)
  @ApiOperation({ summary: '创建支付记录' })
  async create(
    @Body()
    data: {
      registrationId?: string;
      appointmentId?: string;
      amount: number;
      method?: PaymentMethod;
    },
    @Request() req: any,
  ) {
    return this.paymentService.create({
      ...data,
      patientId: req.user.id,
    });
  }

  @Post(':id/process')
  @Permissions(Permission.PAYMENT_PROCESS)
  @ApiOperation({ summary: '处理支付' })
  async processPayment(
    @Param('id') id: string,
    @Body() data: { method: PaymentMethod; transactionId?: string },
  ) {
    return this.paymentService.processPayment(id, data.method, data.transactionId);
  }

  @Post(':id/fail')
  @Roles('ADMIN', 'REGISTRAR')
  @Permissions(Permission.PAYMENT_PROCESS)
  @ApiOperation({ summary: '标记支付失败' })
  async failPayment(@Param('id') id: string) {
    return this.paymentService.failPayment(id);
  }
}
