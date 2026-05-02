import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Doctor, User } from '@prisma/client';
import { DoctorTitle, Role } from '@hospital/shared';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<(Doctor & { user: User; department: any })[]> {
    return this.prisma.doctor.findMany({
      where: { isActive: true, user: { isActive: true } },
      include: {
        user: true,
        department: true,
        schedules: {
          where: { isActive: true },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Doctor & { user: User; department: any; schedules: any[] }> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        schedules: {
          where: { isActive: true },
          orderBy: { date: 'asc' },
          include: { slots: true },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('医生不存在');
    }

    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    return this.prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: true,
        department: true,
      },
    });
  }

  async create(data: {
    userId: string;
    departmentId: string;
    title?: DoctorTitle;
    specialties: string[];
    introduction?: string;
    consultationFee?: number;
  }): Promise<Doctor & { user: User; department: any }> {
    const existingDoctor = await this.findByUserId(data.userId);
    if (existingDoctor) {
      throw new ConflictException('该用户已关联医生信息');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.role !== Role.DOCTOR && user.role !== Role.ADMIN) {
      throw new ConflictException('只有医生或管理员角色才能关联医生信息');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new NotFoundException('科室不存在');
    }

    const doctor = await this.prisma.doctor.create({
      data: {
        userId: data.userId,
        departmentId: data.departmentId,
        title: data.title || DoctorTitle.ATTENDING,
        specialties: JSON.stringify(data.specialties || []),
        introduction: data.introduction,
        consultationFee: data.consultationFee || 50,
      },
      include: {
        user: true,
        department: true,
      },
    });

    this.logger.log(`医生 ${doctor.user?.name} 创建成功，科室: ${department.name}`);

    return doctor;
  }

  async update(
    id: string,
    data: Partial<{
      departmentId: string;
      title: DoctorTitle;
      specialties: string[];
      introduction: string;
      consultationFee: number;
      isActive: boolean;
    }>,
  ): Promise<Doctor & { user: User; department: any }> {
    const doctor = await this.findById(id);

    if (data.departmentId && data.departmentId !== doctor.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!department) {
        throw new NotFoundException('科室不存在');
      }
    }

    const updatedDoctor = await this.prisma.doctor.update({
      where: { id },
      data,
      include: {
        user: true,
        department: true,
      },
    });

    this.logger.log(`医生 ${id} 更新成功`);

    return updatedDoctor;
  }

  async delete(id: string): Promise<void> {
    const doctor = await this.findById(id);

    const schedulesCount = await this.prisma.schedule.count({
      where: { doctorId: id },
    });

    if (schedulesCount > 0) {
      throw new ConflictException(`该医生还有 ${schedulesCount} 个排班，无法删除`);
    }

    await this.prisma.doctor.delete({
      where: { id },
    });

    this.logger.log(`医生 ${doctor.user?.name} 已删除`);
  }

  async softDelete(id: string): Promise<Doctor> {
    return this.update(id, { isActive: false });
  }

  async findByDepartment(departmentId: string): Promise<(Doctor & { user: User; department: any })[]> {
    return this.prisma.doctor.findMany({
      where: {
        departmentId,
        isActive: true,
        user: { isActive: true },
      },
      include: {
        user: true,
        department: true,
        schedules: {
          where: { isActive: true },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { title: 'desc' },
    });
  }

  async search(query: string): Promise<(Doctor & { user: User; department: any })[]> {
    const lowerQuery = query.toLowerCase();
    const doctors = await this.prisma.doctor.findMany({
      where: { isActive: true, user: { isActive: true } },
      include: {
        user: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return doctors.filter(
      (d) =>
        d.user.name?.toLowerCase().includes(lowerQuery) ||
        d.user.username.toLowerCase().includes(lowerQuery) ||
        d.specialties.toLowerCase().includes(lowerQuery) ||
        (d.introduction && d.introduction.toLowerCase().includes(lowerQuery)),
    );
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byTitle: { title: string; count: number }[];
    byDepartment: { departmentId: string; departmentName: string; count: number }[];
  }> {
    const total = await this.prisma.doctor.count();
    const active = await this.prisma.doctor.count({
      where: { isActive: true, user: { isActive: true } },
    });
    const inactive = total - active;

    const byTitle = await this.prisma.doctor.groupBy({
      by: ['title'],
      _count: { id: true },
      where: { isActive: true },
    });

    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: { _count: { select: { doctors: { where: { isActive: true } } } } },
    });

    return {
      total,
      active,
      inactive,
      byTitle: byTitle.map((item) => ({
        title: item.title,
        count: item._count.id,
      })),
      byDepartment: departments.map((d) => ({
        departmentId: d.id,
        departmentName: d.name,
        count: d._count.doctors,
      })),
    };
  }

  async getAvailableDoctorsByDate(
    departmentId: string,
    date: Date,
  ): Promise<(Doctor & { user: User; department: any; schedules: any[] })[]> {
    const normalizedDate = this.normalizeDate(date);

    const doctors = await this.prisma.doctor.findMany({
      where: {
        departmentId,
        isActive: true,
        user: { isActive: true },
      },
      include: {
        user: true,
        department: true,
        schedules: {
          where: {
            date: {
              gte: normalizedDate,
              lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
            },
            isActive: true,
          },
          include: { slots: true },
        },
      },
    });

    return doctors.filter((d) => d.schedules.length > 0);
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
