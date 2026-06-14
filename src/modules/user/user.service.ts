import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getProfile(user: CurrentUserPayload) {
    return this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        realName: true,
        idCardNumber: true,
        phoneNumber: true,
        email: true,
        avatarUrl: true,
        address: true,
        authType: true,
        socialCardNo: true,
        isVerified: true,
        verifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async updateProfile(user: CurrentUserPayload, dto: UpdateUserDto) {
    this.logger.log(`用户更新信息: ${user.userId}`, 'UserService');
    return this.prisma.user.update({
      where: { id: user.userId },
      data: dto,
      select: {
        id: true,
        realName: true,
        phoneNumber: true,
        email: true,
        address: true,
      },
    });
  }

  async getMyApplications(user: CurrentUserPayload, params: { page?: number; pageSize?: number; status?: string }) {
    const { skip, take, page, pageSize } = this.getPagination(params);
    const where: any = { userId: user.userId };
    if (params.status) where.status = params.status;

    const [list, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceItem: { select: { itemCode: true, itemName: true, handlingDepartment: true } },
          timeline: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
      this.prisma.application.count({ where }),
    ]);
    return {
      list,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getMyCertificates(user: CurrentUserPayload, params: { page?: number; pageSize?: number }) {
    const { skip, take, page, pageSize } = this.getPagination(params);
    const [list, total] = await Promise.all([
      this.prisma.electronicCertificate.findMany({
        where: { holderIdCard: (await this.getProfile(user)).idCardNumber || '' },
        skip,
        take,
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.electronicCertificate.count({
        where: { holderIdCard: (await this.getProfile(user)).idCardNumber || '' },
      }),
    ]);
    return {
      list,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getMyNotifications(user: CurrentUserPayload, params: { page?: number; pageSize?: number; unreadOnly?: boolean }) {
    const { skip, take, page, pageSize } = this.getPagination(params);
    const where: any = { userId: user.userId };
    if (params.unreadOnly) where.status = { not: 'READ' };

    const [list, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    const unreadCount = await this.prisma.notification.count({
      where: { userId: user.userId, status: { notIn: ['READ', 'SENT'] } },
    });
    return {
      list,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      unreadCount,
    };
  }

  async markNotificationRead(user: CurrentUserPayload, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId: user.userId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  private getPagination(params: { page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 10));
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    return { page, pageSize, skip, take };
  }
}
