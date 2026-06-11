import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentCallbackDto, RefundDto, PaymentQueryDto } from './dto';
import { User } from '@pet/db';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createPayment(@Req() req: Request & { user: User }, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(req.user.id, dto);
  }

  @Post('callback')
  async handleCallback(@Body() dto: PaymentCallbackDto) {
    return this.paymentService.handleCallback(dto);
  }

  @Post('refund')
  @UseGuards(AuthGuard('jwt'))
  async refund(@Body() dto: RefundDto) {
    return this.paymentService.refund(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findPaginated(@Query() query: PaymentQueryDto) {
    return this.paymentService.findPaginated(query);
  }
}
