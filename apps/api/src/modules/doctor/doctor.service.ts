import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient, DoctorProfile, DoctorStatus, ContentAuditStatus, UserRole } from '@pet/db';
import { DatabaseService } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared';
import type { PaginationResult } from '@pet/shared';
import { CreateDoctorDto, UpdateDoctorDto, DoctorQueryDto, AuditDoctorDto } from './dto/doctor.dto';

@Injectable()
export class DoctorService {
  private readonly prisma: PrismaClient;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.prisma = DatabaseService.getClient();
  }

  async create(createDoctorDto: CreateDoctorDto): Promise<DoctorProfile> {
    const { userId, ...rest } = createDoctorDto;

    const existing = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('该用户已提交医生认证申请');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const doctor = await this.prisma.$transaction(async (tx) => {
      const newDoctor = await tx.doctorProfile.create({
        data: {
          ...rest,
          userId,
          status: DoctorStatus.PENDING_VERIFICATION,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.DOCTOR },
      });

      return newDoctor;
    });

    this.eventEmitter.emit('doctor.created', { doctor });

    return doctor;
  }

  async findAll(query: DoctorQueryDto): Promise<PaginationResult<DoctorProfile>> {
    const { page, pageSize, keyword, department, hospital, specialties, status, isOnline, minRating, sortBy, sortOrder } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { realName: { contains: keyword } },
        { title: { contains: keyword } },
        { hospital: { contains: keyword } },
        { specialties: { hasSome: keyword.split(' ') } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (hospital) {
      where.hospital = hospital;
    }

    if (specialties && specialties.length > 0) {
      where.specialties = { hasEvery: specialties };
    }

    if (status) {
      where.status = status;
    } else {
      where.status = DoctorStatus.VERIFIED;
    }

    if (isOnline !== undefined) {
      where.isOnline = isOnline;
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.rating = 'desc';
      orderBy.consultationCount = 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.doctorProfile.count({ where }),
      this.prisma.doctorProfile.findMany({
        where,
        orderBy,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async findOnlineDoctors(limit: number = 10): Promise<DoctorProfile[]> {
    return this.prisma.doctorProfile.findMany({
      where: {
        status: DoctorStatus.VERIFIED,
        isOnline: true,
      },
      orderBy: [
        { rating: 'desc' },
        { consultationCount: 'desc' },
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<DoctorProfile> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('医生不存在');
    }

    return doctor;
  }

  async findByUserId(userId: string): Promise<DoctorProfile> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('医生不存在');
    }

    return doctor;
  }

  async update(id: string, userId: string, updateDoctorDto: UpdateDoctorDto): Promise<DoctorProfile> {
    const doctor = await this.findOne(id);

    if (doctor.userId !== userId) {
      throw new ForbiddenException('无权限修改此医生信息');
    }

    return this.prisma.doctorProfile.update({
      where: { id },
      data: updateDoctorDto,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.doctorProfile.delete({ where: { id } });
  }

  async auditDoctor(doctorId: string, auditDoctorDto: AuditDoctorDto): Promise<DoctorProfile> {
    const doctor = await this.findOne(doctorId);

    const { status, reason, auditorId } = auditDoctorDto;

    const updatedDoctor = await this.prisma.$transaction(async (tx) => {
      let newStatus: DoctorStatus;
      switch (status) {
        case 'APPROVED':
          newStatus = DoctorStatus.VERIFIED;
          break;
        case 'REJECTED':
          newStatus = DoctorStatus.REJECTED;
          break;
        case 'SUSPENDED':
          newStatus = DoctorStatus.SUSPENDED;
          break;
        default:
          newStatus = doctor.status;
      }

      const updated = await tx.doctorProfile.update({
        where: { id: doctorId },
        data: {
          status: newStatus,
          verifiedAt: status === 'APPROVED' ? new Date() : doctor.verifiedAt,
          rejectReason: status === 'REJECTED' ? reason : doctor.rejectReason,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      await tx.contentAuditLog.create({
        data: {
          contentId: doctorId,
          contentType: 'doctor',
          auditorId,
          status: status === 'APPROVED' ? ContentAuditStatus.APPROVED : ContentAuditStatus.REJECTED,
          reason,
          operation: status === 'APPROVED' ? 'approve' : status === 'REJECTED' ? 'reject' : 'flag',
        },
      });

      return updated;
    });

    this.eventEmitter.emit('doctor.audited', { doctor: updatedDoctor, auditorId });

    return updatedDoctor;
  }

  async updateOnlineStatus(doctorId: string, userId: string, isOnline: boolean): Promise<DoctorProfile> {
    const doctor = await this.findOne(doctorId);

    if (doctor.userId !== userId) {
      throw new ForbiddenException('无权限修改此医生在线状态');
    }

    const updatedDoctor = await this.prisma.doctorProfile.update({
      where: { id: doctorId },
      data: {
        isOnline,
        lastOnlineAt: isOnline ? undefined : new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    this.eventEmitter.emit('doctor.onlineStatusChanged', { doctorId, userId, isOnline });

    return updatedDoctor;
  }

  async updateConsultationCount(doctorId: string): Promise<void> {
    await this.prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { consultationCount: { increment: 1 } },
    });
  }

  async updateRating(doctorId: string, rating: number): Promise<void> {
    const doctor = await this.findOne(doctorId);

    const newRating = (doctor.rating.toNumber() * doctor.reviewCount + rating) / (doctor.reviewCount + 1);

    await this.prisma.doctorProfile.update({
      where: { id: doctorId },
      data: {
        rating: parseFloat(newRating.toFixed(2)),
        reviewCount: { increment: 1 },
      },
    });
  }

  async getDoctorStatistics(doctorId: string): Promise<{
    totalConsultations: number;
    totalReviews: number;
    averageRating: number;
    todayConsultations: number;
  }> {
    const doctor = await this.findOne(doctorId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayConsultations = await this.prisma.consultationOrder.count({
      where: {
        doctorId,
        createdAt: { gte: today },
      },
    });

    return {
      totalConsultations: doctor.consultationCount,
      totalReviews: doctor.reviewCount,
      averageRating: doctor.rating.toNumber(),
      todayConsultations,
    };
  }
}
