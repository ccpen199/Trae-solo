import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, PaymentStatus } from '@pet/db';
import { ConfigService } from '@nestjs/config';
import { buildPaginationResult, calculateOffset, generateOrderNo } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { CreatePaymentDto, PaymentCallbackDto, RefundDto, PaymentQueryDto } from './dto';

@Injectable()
export class PaymentService {
  private readonly prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    this.prisma = new PrismaClient();
  }

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.userId !== userId) {
      throw new BadRequestException('无权支付该订单');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('订单已支付');
    }
    const paymentNo = `PAY${generateOrderNo()}`;
    const paymentRecord = await this.prisma.paymentRecord.create({
      data: {
        orderId: dto.orderId,
        paymentNo,
        method: dto.method as any,
        amount: dto.amount as any,
        status: PaymentStatus.PENDING,
      },
    });
    const paymentParams = this.buildPaymentParams(paymentRecord, dto.method);
    return { paymentRecord, paymentParams };
  }

  async handleCallback(dto: PaymentCallbackDto) {
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { paymentNo: dto.paymentNo },
    });
    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }
    if (payment.status === PaymentStatus.PAID) {
      return { success: true, message: '已处理' };
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentRecord.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          transactionId: dto.transactionId,
          paidAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: payment.method,
          paidAt: new Date(),
          status: 'PENDING_CONFIRM',
        },
      });
    });
    return { success: true };
  }

  async refund(dto: RefundDto) {
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { paymentNo: dto.paymentNo },
    });
    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('只能对已支付的订单发起退款');
    }
    if (dto.refundAmount > Number(payment.amount)) {
      throw new BadRequestException('退款金额不能大于支付金额');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentRecord.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          refundAmount: dto.refundAmount as any,
          refundAt: new Date(),
          refundReason: dto.refundReason,
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: 'REFUNDED',
        },
      });
    });
    return { success: true };
  }

  async findPaginated(query: PaymentQueryDto): Promise<PaginationResult<unknown>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const where: Record<string, unknown> = {};
    if (query.orderId) where.orderId = query.orderId;
    if (query.status) where.status = query.status;

    const [total, items] = await Promise.all([
      this.prisma.paymentRecord.count({ where }),
      this.prisma.paymentRecord.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }

  private buildPaymentParams(payment: any, method: string): Record<string, unknown> {
    const baseParams = {
      paymentNo: payment.paymentNo,
      amount: payment.amount,
      subject: '宠物商城订单支付',
    };
    switch (method) {
      case 'ALIPAY':
        return { ...baseParams, channel: 'alipay', appId: this.configService.get('ALIPAY_APP_ID') };
      case 'WECHAT':
        return { ...baseParams, channel: 'wechat', appId: this.configService.get('WECHAT_APP_ID') };
      case 'BALANCE':
        return { ...baseParams, channel: 'balance' };
      default:
        return baseParams;
    }
  }
}
