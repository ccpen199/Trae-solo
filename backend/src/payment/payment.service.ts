import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentMethod, RegistrationStatus, AppointmentStatus } from '@hospital/shared';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      include: {
        patient: true,
        registration: true,
        appointment: true,
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        patient: true,
        registration: true,
        appointment: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    return payment;
  }

  async findByPatient(patientId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { patientId },
      include: {
        registration: true,
        appointment: true,
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByRegistration(registrationId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { registrationId },
      include: {
        patient: true,
        registration: true,
        refunds: true,
      },
    });
  }

  async create(data: {
    registrationId?: string;
    appointmentId?: string;
    patientId: string;
    amount: number;
    method?: PaymentMethod;
  }): Promise<Payment> {
    const payment = await this.prisma.payment.create({
      data: {
        registrationId: data.registrationId,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        amount: data.amount,
        status: PaymentStatus.PENDING,
        method: data.method,
      },
      include: {
        patient: true,
        registration: true,
        appointment: true,
      },
    });

    this.logger.log(
      `支付记录创建成功: 患者 ${data.patientId}，金额 ${data.amount}`,
    );

    return payment;
  }

  async processPayment(
    paymentId: string,
    method: PaymentMethod,
    transactionId?: string,
  ): Promise<Payment> {
    const payment = await this.findById(paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('该支付已处理');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        method,
        transactionId,
        paidAt: new Date(),
      },
      include: {
        patient: true,
        registration: true,
        appointment: true,
      },
    });

    if (payment.registrationId) {
      await this.prisma.registration.update({
        where: { id: payment.registrationId },
        data: { status: RegistrationStatus.PAID },
      });
    }

    if (payment.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: AppointmentStatus.CONFIRMED },
      });
    }

    this.logger.log(
      `支付处理成功: 支付ID ${paymentId}，方式 ${method}`,
    );

    return updatedPayment;
  }

  async failPayment(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);

    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
      throw new ConflictException('该支付状态无法标记为失败');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    this.logger.log(`支付失败: 支付ID ${paymentId}`);

    return updatedPayment;
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    pending: number;
    processing: number;
    paid: number;
    failed: number;
    refunded: number;
    partialRefunded: number;
    totalAmount: number;
    refundedAmount: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const where: any = {
      createdAt: {
        gte: normalizedDate,
        lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    };

    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      paid: 0,
      failed: 0,
      refunded: 0,
      partialRefunded: 0,
      totalAmount: 0,
      refundedAmount: 0,
    };

    const payments = await this.prisma.payment.findMany({ where });

    stats.total = payments.length;

    for (const payment of payments) {
      stats.totalAmount += payment.amount.toNumber();
      stats.refundedAmount += payment.refundAmount.toNumber();

      switch (payment.status) {
        case PaymentStatus.PENDING:
          stats.pending++;
          break;
        case PaymentStatus.PROCESSING:
          stats.processing++;
          break;
        case PaymentStatus.PAID:
          stats.paid++;
          break;
        case PaymentStatus.FAILED:
          stats.failed++;
          break;
        case PaymentStatus.REFUNDED:
          stats.refunded++;
          break;
        case PaymentStatus.PARTIAL_REFUNDED:
          stats.partialRefunded++;
          break;
      }
    }

    return stats;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
