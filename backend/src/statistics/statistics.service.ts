import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, AppointmentStatus, PaymentStatus } from '@hospital/shared';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(date?: Date): Promise<{
    registration: {
      total: number;
      completed: number;
      cancelled: number;
      refunded: number;
      rate: {
        completion: number;
        attendance: number;
        cancellation: number;
      };
    };
    appointment: {
      total: number;
      confirmed: number;
      cancelled: number;
      completed: number;
    };
    payment: {
      total: number;
      totalAmount: number;
      refundAmount: number;
      netAmount: number;
    };
    queue: {
      waiting: number;
      inConsultation: number;
      completed: number;
    };
  }> {
    const normalizedDate = date
      ? this.normalizeDate(date)
      : this.normalizeDate(new Date());

    const registrations = await this.prisma.registration.findMany({
      where: {
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        payment: true,
        queueItem: true,
      },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const queueItems = await this.prisma.queueItem.findMany({
      where: {
        createdAt: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const registrationStats = {
      total: registrations.length,
      completed: 0,
      cancelled: 0,
      refunded: 0,
      rate: {
        completion: 0,
        attendance: 0,
        cancellation: 0,
      },
    };

    for (const reg of registrations) {
      switch (reg.status) {
        case RegistrationStatus.COMPLETED:
          registrationStats.completed++;
          break;
        case RegistrationStatus.CANCELLED:
          registrationStats.cancelled++;
          break;
        case RegistrationStatus.REFUNDED:
          registrationStats.refunded++;
          break;
      }
    }

    if (registrations.length > 0) {
      registrationStats.rate.completion = Math.round(
        (registrationStats.completed / registrations.length) * 100,
      );
      registrationStats.rate.attendance = Math.round(
        ((registrations.length - registrationStats.cancelled - registrationStats.refunded) /
          registrations.length) *
          100,
      );
      registrationStats.rate.cancellation = Math.round(
        ((registrationStats.cancelled + registrationStats.refunded) / registrations.length) * 100,
      );
    }

    const appointmentStats = {
      total: appointments.length,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };

    for (const apt of appointments) {
      switch (apt.status) {
        case AppointmentStatus.CONFIRMED:
          appointmentStats.confirmed++;
          break;
        case AppointmentStatus.CANCELLED:
          appointmentStats.cancelled++;
          break;
        case AppointmentStatus.COMPLETED:
          appointmentStats.completed++;
          break;
      }
    }

    const paymentStats = {
      total: 0,
      totalAmount: 0,
      refundAmount: 0,
      netAmount: 0,
    };

    const payments = registrations.filter((r) => r.payment);
    paymentStats.total = payments.length;
    paymentStats.totalAmount = payments.reduce(
      (sum, r) => sum + (r.payment?.amount || 0),
      0,
    );

    const refunds = await this.prisma.refund.findMany({
      where: {
        createdAt: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: 'COMPLETED',
      },
    });

    paymentStats.refundAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
    paymentStats.netAmount = paymentStats.totalAmount - paymentStats.refundAmount;

    const queueStats = {
      waiting: 0,
      inConsultation: 0,
      completed: 0,
    };

    for (const item of queueItems) {
      switch (item.status) {
        case 'WAITING':
        case 'CALLED':
          queueStats.waiting++;
          break;
        case 'IN_CONSULTATION':
          queueStats.inConsultation++;
          break;
        case 'COMPLETED':
          queueStats.completed++;
          break;
      }
    }

    return {
      registration: registrationStats,
      appointment: appointmentStats,
      payment: paymentStats,
      queue: queueStats,
    };
  }

  async getDepartmentStats(date?: Date): Promise<
    Array<{
      departmentId: string;
      departmentName: string;
      registrations: number;
      completed: number;
      cancelled: number;
      revenue: number;
      doctors: Array<{
        doctorId: string;
        doctorName: string;
        registrations: number;
        completed: number;
        avgDuration: number;
      }>;
    }>
  > {
    const normalizedDate = date
      ? this.normalizeDate(date)
      : this.normalizeDate(new Date());

    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        doctors: {
          include: {
            user: true,
            registrations: {
              where: {
                registrationDate: {
                  gte: normalizedDate,
                  lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
                },
              },
              include: { payment: true },
            },
          },
        },
      },
    });

    return departments.map((dept) => {
      const deptRegistrations = dept.doctors.flatMap((d) => d.registrations);
      const completed = deptRegistrations.filter(
        (r) => r.status === RegistrationStatus.COMPLETED,
      ).length;
      const cancelled = deptRegistrations.filter(
        (r) => r.status === RegistrationStatus.CANCELLED || r.status === RegistrationStatus.REFUNDED,
      ).length;
      const revenue = deptRegistrations
        .filter((r) => r.payment?.status === PaymentStatus.PAID)
        .reduce((sum, r) => sum + (r.payment?.amount || 0), 0);

      const doctors = dept.doctors
        .filter((d) => d.registrations.length > 0)
        .map((doc) => {
          const docCompleted = doc.registrations.filter(
            (r) => r.status === RegistrationStatus.COMPLETED,
          );
          const totalDuration = docCompleted.reduce((sum, r) => {
            if (r.consultationStartTime && r.consultationEndTime) {
              return sum + (r.consultationEndTime.getTime() - r.consultationStartTime.getTime());
            }
            return sum;
          }, 0);

          return {
            doctorId: doc.id,
            doctorName: doc.user.name,
            registrations: doc.registrations.length,
            completed: docCompleted.length,
            avgDuration: docCompleted.length > 0
              ? Math.round(totalDuration / docCompleted.length / 60000)
              : 0,
          };
        });

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        registrations: deptRegistrations.length,
        completed,
        cancelled,
        revenue,
        doctors,
      };
    });
  }

  async getDoctorStats(doctorId: string, date?: Date): Promise<{
    basic: {
      name: string;
      department: string;
      title: string;
    };
    today: {
      total: number;
      completed: number;
      inConsultation: number;
      waiting: number;
      cancelled: number;
      avgDuration: number;
      revenue: number;
    };
    weekly: {
      total: number;
      completed: number;
      avgDuration: number;
      revenue: number;
    };
  }> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: true,
        department: true,
      },
    });

    if (!doctor) {
      throw new Error('医生不存在');
    }

    const normalizedDate = date
      ? this.normalizeDate(date)
      : this.normalizeDate(new Date());

    const weekStart = new Date(normalizedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const todayRegistrations = await this.prisma.registration.findMany({
      where: {
        doctorId,
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        payment: true,
        queueItem: true,
      },
    });

    const weeklyRegistrations = await this.prisma.registration.findMany({
      where: {
        doctorId,
        registrationDate: {
          gte: weekStart,
          lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: RegistrationStatus.COMPLETED,
      },
      include: {
        payment: true,
      },
    });

    const todayStats = {
      total: todayRegistrations.length,
      completed: 0,
      inConsultation: 0,
      waiting: 0,
      cancelled: 0,
      avgDuration: 0,
      revenue: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const reg of todayRegistrations) {
      switch (reg.status) {
        case RegistrationStatus.COMPLETED:
          todayStats.completed++;
          if (reg.consultationStartTime && reg.consultationEndTime) {
            totalDuration +=
              (reg.consultationEndTime.getTime() - reg.consultationStartTime.getTime()) / 60000;
            durationCount++;
          }
          break;
        case RegistrationStatus.IN_CONSULTATION:
          todayStats.inConsultation++;
          break;
        case RegistrationStatus.CHECKED_IN:
          if (reg.queueItem?.status === 'WAITING') {
            todayStats.waiting++;
          }
          break;
        case RegistrationStatus.CANCELLED:
        case RegistrationStatus.REFUNDED:
          todayStats.cancelled++;
          break;
      }
    }

    todayStats.avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
    todayStats.revenue = todayRegistrations
      .filter((r) => r.payment?.status === PaymentStatus.PAID)
      .reduce((sum, r) => sum + (r.payment?.amount || 0), 0);

    const weeklyCompleted = weeklyRegistrations.filter(
      (r) => r.status === RegistrationStatus.COMPLETED,
    );
    const weeklyDuration = weeklyCompleted.reduce((sum, r) => {
      if (r.consultationStartTime && r.consultationEndTime) {
        return sum + (r.consultationEndTime.getTime() - r.consultationStartTime.getTime());
      }
      return sum;
    }, 0);

    return {
      basic: {
        name: doctor.user.name,
        department: doctor.department.name,
        title: doctor.title,
      },
      today: todayStats,
      weekly: {
        total: weeklyRegistrations.length,
        completed: weeklyCompleted.length,
        avgDuration: weeklyCompleted.length > 0
          ? Math.round(weeklyDuration / weeklyCompleted.length / 60000)
          : 0,
        revenue: weeklyRegistrations
          .filter((r) => r.payment?.status === PaymentStatus.PAID)
          .reduce((sum, r) => sum + (r.payment?.amount || 0), 0),
      },
    };
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
