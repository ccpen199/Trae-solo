import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentMethod, UserRole } from '../common/types';
import { PaymentRequest, SettlementSummary } from './engines/payment-settlement.engine';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('支付')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '处理支付' })
  async processPayment(
    @Body() request: PaymentRequest,
    @Request() req,
  ): Promise<Payment> {
    return this.paymentsService.processPayment(
      request,
      req.user.id,
      req.user.name,
    );
  }

  @Post('combined')
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '组合支付' })
  async processCombinedPayment(
    @Body()
    body: {
      orderId: string;
      payments: Array<{
        method: PaymentMethod;
        amount: number;
        memberId?: string;
        transactionId?: string;
      }>;
    },
    @Request() req,
  ): Promise<Payment[]> {
    return this.paymentsService.processCombinedPayment(
      body.orderId,
      body.payments,
      req.user.id,
      req.user.name,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取支付详情' })
  async getPaymentById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Payment> {
    return this.paymentsService.getPaymentById(id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: '获取订单的支付记录' })
  async getPaymentsByOrderId(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<Payment[]> {
    return this.paymentsService.getPaymentsByOrderId(orderId);
  }

  @Get('settlement/:orderId')
  @ApiOperation({ summary: '获取订单结算摘要' })
  async getSettlementSummary(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<SettlementSummary> {
    return this.paymentsService.getSettlementSummary(orderId);
  }

  @Get('statistics/summary')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取支付统计' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getPaymentStatistics(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<{
    totalAmount: number;
    totalCount: number;
    byMethod: Array<{
      method: PaymentMethod;
      amount: number;
      count: number;
    }>;
  }> {
    return this.paymentsService.getPaymentStatistics(
      new Date(dateFrom),
      new Date(dateTo),
    );
  }
}
