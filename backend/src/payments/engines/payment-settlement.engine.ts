import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Member } from '../../members/entities/member.entity';
import { OrderLog } from '../../orders/entities/order-log.entity';
import { OrderStatus, PaymentMethod, PaymentStatus, OrderLogAction } from '../../common/types';
import { WebSocketGatewayService } from '../../websocket/websocket-gateway.service';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  memberId?: string;
  transactionId?: string;
  remarks?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentNumber?: string;
  amount?: number;
  errorMessage?: string;
}

export interface SettlementSummary {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  payableAmount: number;
  paidAmount: number;
  balanceDue: number;
  payments: Payment[];
  isFullyPaid: boolean;
}

@Injectable()
export class PaymentSettlementEngine {
  private readonly logger = new Logger(PaymentSettlementEngine.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(OrderLog)
    private orderLogRepository: Repository<OrderLog>,
    private readonly webSocketService: WebSocketGatewayService,
  ) {}

  async processPayment(
    request: PaymentRequest,
    operatorId: string,
    operatorName: string,
  ): Promise<PaymentResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.orderRepository.findOne({
        where: { id: request.orderId },
      });

      if (!order) {
        throw new Error(`订单不存在: ${request.orderId}`);
      }

      const currentBalanceDue = order.payableAmount - order.paidAmount;

      if (request.amount > currentBalanceDue) {
        throw new Error(`支付金额超过应付金额: 应付 ¥${currentBalanceDue.toFixed(2)}, 支付 ¥${request.amount.toFixed(2)}`);
      }

      if (request.method === PaymentMethod.MEMBER) {
        if (!request.memberId) {
          throw new Error('会员支付需要提供会员ID');
        }

        const member = await this.memberRepository.findOne({
          where: { id: request.memberId },
        });

        if (!member) {
          throw new Error(`会员不存在: ${request.memberId}`);
        }

        if (member.balance < request.amount) {
          throw new Error(`会员余额不足: 当前余额 ¥${member.balance.toFixed(2)}, 需要 ¥${request.amount.toFixed(2)}`);
        }

        member.balance = member.balance - request.amount;
        await queryRunner.manager.save(Member, member);
      }

      const paymentNumber = this.generatePaymentNumber();

      const payment = this.paymentRepository.create({
        paymentNumber,
        orderId: request.orderId,
        method: request.method,
        status: PaymentStatus.PAID,
        amount: request.amount,
        transactionId: request.transactionId,
        operatorId,
        paidAt: new Date(),
        remarks: request.remarks,
        paymentDetails: {
          memberId: request.memberId,
        },
      });

      await queryRunner.manager.save(Payment, payment);

      order.paidAmount = order.paidAmount + request.amount;

      const isFullyPaid = order.paidAmount >= order.payableAmount;
      if (isFullyPaid) {
        order.status = OrderStatus.COMPLETED;
        order.completedAt = new Date();
      }

      await queryRunner.manager.save(Order, order);

      const log = this.orderLogRepository.create({
        orderId: request.orderId,
        action: OrderLogAction.PAYMENT_RECEIVED,
        description: `收到支付: ¥${request.amount.toFixed(2)} (${this.getPaymentMethodLabel(request.method)})`,
        details: {
          paymentId: payment.id,
          paymentNumber,
          amount: request.amount,
          method: request.method,
        },
        operatorId,
        operatorName,
      });

      await queryRunner.manager.save(OrderLog, log);

      if (isFullyPaid && request.memberId) {
        await this.updateMemberStats(request.memberId, order, queryRunner);
      }

      await queryRunner.commitTransaction();

      this.webSocketService.notifyPaymentComplete(order.id, payment);

      if (isFullyPaid) {
        this.webSocketService.notifyOrderStatusChange(order);
      }

      this.logger.log(
        `订单 ${order.orderNumber} 支付成功: ¥${request.amount.toFixed(2)} (${this.getPaymentMethodLabel(request.method)})`,
      );

      return {
        success: true,
        paymentId: payment.id,
        paymentNumber,
        amount: request.amount,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`支付处理失败: ${error.message}`);
      return {
        success: false,
        errorMessage: error.message,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async getSettlementSummary(orderId: string): Promise<SettlementSummary> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    const balanceDue = Math.max(0, order.payableAmount - order.paidAmount);
    const isFullyPaid = balanceDue <= 0;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      payableAmount: order.payableAmount,
      paidAmount: order.paidAmount,
      balanceDue,
      payments: order.payments || [],
      isFullyPaid,
    };
  }

  async processRefund(
    paymentId: string,
    refundAmount: number,
    operatorId: string,
    operatorName: string,
  ): Promise<PaymentResult> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new Error(`支付记录不存在: ${paymentId}`);
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new Error(`支付状态不允许退款: ${payment.status}`);
    }

    const maxRefundAmount = payment.amount - payment.refundAmount;
    if (refundAmount > maxRefundAmount) {
      throw new Error(`退款金额超过可退金额: 可退 ¥${maxRefundAmount.toFixed(2)}, 申请 ¥${refundAmount.toFixed(2)}`);
    }

    if (payment.method === PaymentMethod.MEMBER) {
      const paymentDetails = payment.paymentDetails as any;
      if (paymentDetails?.memberId) {
        const member = await this.memberRepository.findOne({
          where: { id: paymentDetails.memberId },
        });
        if (member) {
          member.balance = member.balance + refundAmount;
          await this.memberRepository.save(member);
        }
      }
    }

    payment.refundAmount = payment.refundAmount + refundAmount;
    if (payment.refundAmount >= payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
    }
    payment.refundedAt = new Date();

    await this.paymentRepository.save(payment);

    const order = payment.order;
    order.paidAmount = order.paidAmount - refundAmount;
    await this.orderRepository.save(order);

    this.logger.log(
      `支付 ${payment.paymentNumber} 退款成功: ¥${refundAmount.toFixed(2)}`,
    );

    return {
      success: true,
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: refundAmount,
    };
  }

  private async updateMemberStats(
    memberId: string,
    order: Order,
    queryRunner: any,
  ): Promise<void> {
    const member = await queryRunner.manager.findOne(Member, {
      where: { id: memberId },
    });

    if (member) {
      member.totalSpent = member.totalSpent + order.paidAmount;
      member.orderCount = member.orderCount + 1;
      member.lastVisitAt = new Date();

      await queryRunner.manager.save(Member, member);
    }
  }

  private generatePaymentNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY${year}${month}${day}${random}`;
  }

  private getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: '现金',
      [PaymentMethod.WECHAT]: '微信支付',
      [PaymentMethod.ALIPAY]: '支付宝',
      [PaymentMethod.CARD]: '银行卡',
      [PaymentMethod.MEMBER]: '会员余额',
      [PaymentMethod.COMBINED]: '组合支付',
    };
    return labels[method] || method;
  }
}
