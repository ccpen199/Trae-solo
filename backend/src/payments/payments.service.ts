import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Order } from '../../orders/entities/order.entity';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../../common/types';
import { PaymentSettlementEngine, PaymentRequest, SettlementSummary } from '../engines/payment-settlement.engine';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly paymentSettlementEngine: PaymentSettlementEngine,
  ) {}

  async processPayment(
    request: PaymentRequest,
    operatorId: string,
    operatorName: string,
  ): Promise<Payment> {
    const result = await this.paymentSettlementEngine.processPayment(
      request,
      operatorId,
      operatorName,
    );

    if (!result.success) {
      throw new Error(result.errorMessage);
    }

    return this.paymentRepository.findOne({
      where: { id: result.paymentId },
    });
  }

  async getPaymentById(id: string): Promise<Payment> {
    return this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async getSettlementSummary(orderId: string): Promise<SettlementSummary> {
    return this.paymentSettlementEngine.getSettlementSummary(orderId);
  }

  async processCombinedPayment(
    orderId: string,
    payments: Array<{
      method: PaymentMethod;
      amount: number;
      memberId?: string;
      transactionId?: string;
    }>,
    operatorId: string,
    operatorName: string,
  ): Promise<Payment[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = order.payableAmount - order.paidAmount;

    if (totalPaymentAmount > balanceDue) {
      throw new Error(`支付总金额超过应付金额: 应付 ¥${balanceDue.toFixed(2)}, 支付 ¥${totalPaymentAmount.toFixed(2)}`);
    }

    const results: Payment[] = [];

    for (const payment of payments) {
      const result = await this.processPayment(
        {
          orderId,
          amount: payment.amount,
          method: payment.method,
          memberId: payment.memberId,
          transactionId: payment.transactionId,
        },
        operatorId,
        operatorName,
      );
      results.push(result);
    }

    return results;
  }

  async getPaymentStatistics(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    totalAmount: number;
    totalCount: number;
    byMethod: Array<{
      method: PaymentMethod;
      amount: number;
      count: number;
    }>;
  }> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.paidAt >= :dateFrom', { dateFrom })
      .andWhere('payment.paidAt <= :dateTo', { dateTo })
      .andWhere('payment.status = :status', { status: PaymentStatus.PAID });

    const payments = await queryBuilder.getMany();

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCount = payments.length;

    const byMethodMap = new Map<PaymentMethod, { amount: number; count: number }>();

    for (const payment of payments) {
      const existing = byMethodMap.get(payment.method) || { amount: 0, count: 0 };
      byMethodMap.set(payment.method, {
        amount: existing.amount + payment.amount,
        count: existing.count + 1,
      });
    }

    const byMethod = Array.from(byMethodMap.entries()).map(([method, data]) => ({
      method,
      ...data,
    }));

    return {
      totalAmount,
      totalCount,
      byMethod,
    };
  }
}
