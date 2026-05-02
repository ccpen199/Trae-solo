import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Refund } from '@prisma/client';
import { RefundStatus, RefundReason, PaymentStatus, SlotStatus } from '@hospital/shared';

interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  refundPercentage: number;
}

@Injectable()
export class RefundEngineService {
  private readonly logger = new Logger(RefundEngineService.name);

  constructor(private prisma: PrismaService) {}

  async checkRefundEligibility(
    registrationId: string,
  ): Promise<RefundEligibility> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        slot: true,
        schedule: true,
        payment: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    if (registration.status === 'REFUNDED') {
      return {
        eligible: false,
        reason: '已退费',
        refundPercentage: 0,
      };
    }

    if (registration.status === 'COMPLETED') {
      return {
        eligible: false,
        reason: '就诊已完成，无法退费',
        refundPercentage: 0,
      };
    }

    if (registration.status === 'IN_CONSULTATION') {
      return {
        eligible: false,
        reason: '正在就诊中，无法退费',
        refundPercentage: 0,
      };
    }

    const now = new Date();
    const appointmentDateTime = this.combineDateAndTime(
      registration.registrationDate,
      registration.slot?.startTime || '00:00',
    );

    const timeUntilAppointment = appointmentDateTime.getTime() - now.getTime();
    const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);

    let refundPercentage = 100;
    let reason = '';

    if (hoursUntilAppointment < 0) {
      return {
        eligible: false,
        reason: '预约时间已过，无法退费',
        refundPercentage: 0,
      };
    } else if (hoursUntilAppointment < 24) {
      refundPercentage = 80;
      reason = '距离预约时间不足24小时，退费80%';
    } else if (hoursUntilAppointment < 48) {
      refundPercentage = 90;
      reason = '距离预约时间不足48小时，退费90%';
    } else {
      reason = '距离预约时间充足，全额退费';
    }

    return {
      eligible: true,
      reason,
      refundPercentage,
    };
  }

  async initiateRefund(
    registrationId: string,
    reason: RefundReason,
    reasonDetail?: string,
    operatorId?: string,
  ): Promise<Refund> {
    const eligibility = await this.checkRefundEligibility(registrationId);

    if (!eligibility.eligible) {
      throw new BadRequestException(eligibility.reason);
    }

    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        payment: true,
        slot: true,
        appointment: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    if (!registration.payment) {
      throw new BadRequestException('该挂号记录没有支付记录');
    }

    if (registration.payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('支付状态异常，无法退费');
    }

    const refundAmount = registration.fee
      .multipliedBy(eligibility.refundPercentage)
      .dividedBy(100);

    const refund = await this.prisma.$transaction(async (tx) => {
      const newRefund = await tx.refund.create({
        data: {
          paymentId: registration.paymentId!,
          registrationId: registration.id,
          appointmentId: registration.appointmentId,
          amount: refundAmount,
          status: RefundStatus.PENDING,
          reason,
          reasonDetail,
          processedBy: operatorId,
        },
      });

      await tx.registration.update({
        where: { id: registrationId },
        data: {
          status: 'CANCELLED',
        },
      });

      if (registration.slotId) {
        await tx.timeSlot.update({
          where: { id: registration.slotId },
          data: {
            status: SlotStatus.AVAILABLE,
            appointmentId: null,
            lockedBy: null,
            lockedAt: null,
          },
        });

        if (registration.scheduleId) {
          await tx.schedule.update({
            where: { id: registration.scheduleId },
            data: {
              availableSlots: { increment: 1 },
            },
          });
        }
      }

      if (registration.appointmentId) {
        await tx.appointment.update({
          where: { id: registration.appointmentId },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      return newRefund;
    });

    this.logger.log(
      `发起退费申请: 挂号ID ${registrationId}, 金额 ${refundAmount}, 原因 ${reason}`,
    );

    const autoApprove = process.env.REFUND_AUTO_APPROVE === 'true';
    if (autoApprove) {
      return this.approveRefund(refund.id, operatorId || 'system');
    }

    return refund;
  }

  async approveRefund(
    refundId: string,
    operatorId: string,
  ): Promise<Refund> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: true,
        registration: true,
      },
    });

    if (!refund) {
      throw new NotFoundException('退费记录不存在');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new ConflictException('退费申请状态异常');
    }

    const updatedRefund = await this.prisma.$transaction(async (tx) => {
      const newRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.COMPLETED,
          processedAt: new Date(),
          processedBy: operatorId,
        },
      });

      if (refund.payment) {
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: {
            status: PaymentStatus.REFUNDED,
            refundAmount: refund.payment.refundAmount.plus(refund.amount),
            refundedAt: new Date(),
          },
        });
      }

      if (refund.registration) {
        await tx.registration.update({
          where: { id: refund.registrationId! },
          data: {
            status: 'REFUNDED',
          },
        });
      }

      return newRefund;
    });

    this.logger.log(
      `退费申请已批准: 退费ID ${refundId}, 操作人 ${operatorId}`,
    );

    return updatedRefund;
  }

  async rejectRefund(
    refundId: string,
    operatorId: string,
    rejectReason: string,
  ): Promise<Refund> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('退费记录不存在');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new ConflictException('退费申请状态异常');
    }

    const updatedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.REJECTED,
        processedAt: new Date(),
        processedBy: operatorId,
        notes: rejectReason,
      },
    });

    if (refund.registrationId) {
      await this.prisma.registration.update({
        where: { id: refund.registrationId },
        data: {
          status: 'PAID',
        },
      });
    }

    this.logger.log(
      `退费申请被拒绝: 退费ID ${refundId}, 操作人 ${operatorId}, 原因 ${rejectReason}`,
    );

    return updatedRefund;
  }

  async processOnlineRefund(
    refundId: string,
    transactionId: string,
  ): Promise<Refund> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('退费记录不存在');
    }

    if (refund.status !== RefundStatus.PROCESSING && refund.status !== RefundStatus.PENDING) {
      throw new ConflictException('退费申请状态异常');
    }

    const updatedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.COMPLETED,
        transactionId,
        processedAt: new Date(),
      },
    });

    this.logger.log(
      `在线退费处理完成: 退费ID ${refundId}, 交易流水号 ${transactionId}`,
    );

    return updatedRefund;
  }

  async getRefundStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRefunds: number;
    totalAmount: number;
    pendingCount: number;
    completedCount: number;
    rejectedCount: number;
    averageProcessingTime: number;
  }> {
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const refunds = await this.prisma.refund.findMany({
      where,
      include: {
        payment: true,
      },
    });

    let totalAmount = 0;
    let totalProcessingTime = 0;
    let processedCount = 0;

    const stats = {
      totalRefunds: refunds.length,
      totalAmount: 0,
      pendingCount: 0,
      completedCount: 0,
      rejectedCount: 0,
      averageProcessingTime: 0,
    };

    for (const refund of refunds) {
      totalAmount = totalAmount + refund.amount.toNumber();

      switch (refund.status) {
        case RefundStatus.PENDING:
          stats.pendingCount++;
          break;
        case RefundStatus.COMPLETED:
          stats.completedCount++;
          break;
        case RefundStatus.REJECTED:
          stats.rejectedCount++;
          break;
      }

      if (refund.processedAt) {
        const processingTime = (refund.processedAt.getTime() - refund.createdAt.getTime()) / (1000 * 60);
        totalProcessingTime += processingTime;
        processedCount++;
      }
    }

    stats.totalAmount = totalAmount;
    if (processedCount > 0) {
      stats.averageProcessingTime = Math.round(totalProcessingTime / processedCount);
    }

    return stats;
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }
}
