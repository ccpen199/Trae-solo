import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, MachineryStatus } from '../types/enums';

@Injectable()
export class MachineriesService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: {
      name: string;
      type: string;
      brand: string;
      model: string;
      plateNumber?: string;
      capacity?: number;
      locationLng?: number;
      locationLat?: number;
      operatorId?: string;
    },
  ) {
    return this.prisma.machinery.create({
      data: {
        ...data,
        status: MachineryStatus.AVAILABLE,
      },
      include: {
        operator: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async findAll(
    status?: MachineryStatus,
    operatorId?: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (operatorId) {
      where.operatorId = operatorId;
    }

    const [machineries, total] = await Promise.all([
      this.prisma.machinery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          operator: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      this.prisma.machinery.count({ where }),
    ]);

    return {
      machineries,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const machinery = await this.prisma.machinery.findUnique({
      where: { id },
      include: {
        operator: {
          select: { id: true, name: true, phone: true },
        },
        orders: true,
        repairOrders: true,
      },
    });

    if (!machinery) {
      throw new NotFoundException('农机不存在');
    }

    return machinery;
  }

  async update(
    id: string,
    data: {
      name?: string;
      type?: string;
      brand?: string;
      model?: string;
      plateNumber?: string;
      capacity?: number;
      locationLng?: number;
      locationLat?: number;
      operatorId?: string;
      status?: MachineryStatus;
    },
  ) {
    return this.prisma.machinery.update({
      where: { id },
      data,
      include: {
        operator: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async updateLocation(
    id: string,
    lng: number,
    lat: number,
    operatorId: string,
    userRole: UserRole,
  ) {
    const machinery = await this.findOne(id);

    if (
      userRole === UserRole.MACHINERY_OPERATOR &&
      machinery.operatorId !== operatorId
    ) {
      throw new ForbiddenException('只能更新自己操作的农机位置');
    }

    return this.prisma.machinery.update({
      where: { id },
      data: {
        locationLng: lng,
        locationLat: lat,
      },
      include: {
        operator: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }
}
