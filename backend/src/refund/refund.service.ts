import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RefundStatus,
  RefundReason,
  RegistrationStatus,
  PaymentStatus,
  AppointmentStatus,
  SlotStatus,
} from '@hospital/shared';
import { RefundEngineService } from '../engines/refund-engine.service';
import { SlotEngineService } from '../engines/slot-engine.service';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private prisma: PrismaService,
    private refundEngine: RefundEngineService,
    private slotEngine: SlotEngineService,
  ) {}

  async processRefund(
    registrationId: string,
    reason: RefundReason,
    operatorId: string,
    notes?: string,
  ): Promise<any> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        payment: true,
        appointment: true,
        timeSlot: true,
        doctor: true,
        patient: true,
        queueItem: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    const refundCheck = this.refundEngine.checkRefundEligibility(
      registration.registrationDate,
      registration.status,
      registration.payment?.status,
    );

    if (!refundCheck.isEligible) {
      throw new ConflictException(refundCheck.reason);
    }

    if (registration.payment && registration.payment.status !== PaymentStatus.PAID) {
      throw new ConflictException('该挂号尚未完成支付');
    }

    const refundAmount = this.refundEngine.calculateRefundAmount(
      registration.registrationDate,
      registration.fee,
      registration.payment?.amount || 0,
    );

    if (refundAmount <= 0) {
      throw new ConflictException('退款金额为0，无需退款');
    }

    return this.prisma.$transaction(async (tx) => {
      let refund = await tx.refund.findFirst({
        where: { registrationId },
      });

      if (refund && refund.status === RefundStatus.PENDING) {
        throw new ConflictException('退款申请已存在，请勿重复申请');
      }

      if (refund && refund.status === RefundStatus.COMPLETED) {
        throw new ConflictException('已完成退款，无需重复操作');
      }

      if (!refund) {
        refund = await tx.refund.create({
          data: {
            registrationId,
            amount: refundAmount,
            reason,
            notes,
            status: RefundStatus.PENDING,
            operatorId,
          },
        });
      }

      const refundResult = await this.refundEngine.processRefund({
        amount: refundAmount,
        paymentMethod: registration.payment?.paymentMethod || 'ONLINE',
        transactionId: registration.payment?.id || '',
        patientName: registration.patient.name,
      });

      const updatedRefund = await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: refundResult.success ? RefundStatus.COMPLETED : RefundStatus.FAILED,
          refundTransactionId: refundResult.transactionId,
          refundedAt: new Date(),
          failureReason: refundResult.errorMessage,
        },
      });

      if (refundResult.success) {
        await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: RegistrationStatus.REFUNDED,
            cancelledAt: new Date(),
          },
        });

        if (registration.appointmentId) {
          await tx.appointment.update({
            where: { id: registration.appointmentId },
            data: {
              status: AppointmentStatus.CANCELLED,
              cancelledAt: new Date(),
            },
          });
        }

        if (registration.queueItemId) {
          await tx.queueItem.delete({
            where: { id: registration.queueItemId },
          });
        }

        if (registration.timeSlotId) {
          await this.slotEngine.releaseSlot(registration.timeSlotId);
        }
      }

      this.logger.log(
        `退款处理: 挂号 ${registrationId}，金额 ${refundAmount}，状态 ${updatedRefund.status}`,
      );

      return {
        registrationId,
        refund: updatedRefund,
        success: refundResult.success,
        message: refundResult.success ? '退款成功' : '退款处理失败',
      };
    });
  }

  async cancelAppointment(appointmentId: string, operatorId: string): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        timeSlot: true,
        registration: { include: { payment: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('预约记录不存在');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ConflictException('预约已取消');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new ConflictException('预约已完成，无法取消');
    }

    let refundResult = null;
    if (appointment.registration) {
      refundResult = await this.processRefund(
        appointment.registration.id,
        RefundReason.PATIENT_CANCEL,
        operatorId,
        '预约取消自动退款',
      );
    } else {
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      if (appointment.timeSlotId) {
        await this.slotEngine.releaseSlot(appointment.timeSlotId);
      }
    }

    this.logger.log(`预约取消: 患者 ${appointment.patientId}，预约 ${appointmentId}`);

    return {
      appointmentId,
      status: AppointmentStatus.CANCELLED,
      refund: refundResult,
      message: '预约取消成功',
    };
  }

  async getRefunds(filters?: {
    status?: RefundStatus;
    startDate?: Date;
    endDate?: Date;
    patientId?: string;
  }): Promise<any[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.patientId) {
      where.registration = { patientId: filters.patientId };
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.refund.findMany({
      where,
      include: {
        registration: {
          include: {
            patient: true,
            doctor: { include: { user: true } },
            department: true,
          },
        },
        operator: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    totalAmount: number;
    refundedAmount: number;
  }> {
    const normalizedDate = date
      ? this.normalizeDate(date)
      : this.normalizeDate(new Date());

    const refunds = await this.prisma.refund.findMany({
      where: {
        createdAt: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const stats = {
      total: refunds.length,
      pending: 0,
      completed: 0,
      failed: 0,
      totalAmount: 0,
      refundedAmount: 0,
    };

    for (const refund of refunds) {
      stats.totalAmount += refund.amount;
      switch (refund.status) {
        case RefundStatus.PENDING:
          stats.pending++;
          break;
        case RefundStatus.COMPLETED:
          stats.completed++;
          stats.refundedAmount += refund.amount;
          break;
        case RefundStatus.FAILED:
          stats.failed++;
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
