import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaClient, UserStatus, UserRole } from '@pet/db';
import { buildPaginationResult, calculateOffset, omit } from '@pet/shared/utils';
import type { PaginationResult, ListQueryParams } from '@pet/shared/types';
import type { UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class UserService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
        doctor: true,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return omit(user, ['password']);
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return omit(updated, ['password']);
  }

  async getMembershipInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        coupons: {
          where: { status: 'unused' },
          take: 5,
          orderBy: { validTo: 'asc' },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return {
      level: user.membershipLevel,
      growthPoints: user.growthPoints,
      membershipExpireAt: user.membershipExpireAt,
      balance: user.balance,
      point: user.point,
      coupons: user.coupons,
    };
  }

  async getAddressList(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async getAddressById(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      throw new NotFoundException('地址不存在');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException('无权访问该地址');
    }
    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.userAddress.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      throw new NotFoundException('地址不存在');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException('无权修改该地址');
    }
    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }
    return this.prisma.userAddress.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      throw new NotFoundException('地址不存在');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException('无权删除该地址');
    }
    await this.prisma.userAddress.delete({ where: { id: addressId } });
    return { success: true };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      throw new NotFoundException('地址不存在');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException('无权操作该地址');
    }
    await this.prisma.$transaction([
      this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);
    return { success: true };
  }

  async getUserList(params: ListQueryParams): Promise<PaginationResult<unknown>> {
    const { page, pageSize, keyword, sortBy, sortOrder } = params;
    const where = keyword
      ? {
          OR: [
            { phone: { contains: keyword } },
            { nickname: { contains: keyword } },
          ],
        }
      : {};

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'desc' }
      : { createdAt: 'desc' as const };

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        orderBy,
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          gender: true,
          role: true,
          membershipLevel: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatar: true,
        gender: true,
        birthday: true,
        role: true,
        membershipLevel: true,
        membershipExpireAt: true,
        growthPoints: true,
        balance: true,
        point: true,
        isVerified: true,
        status: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('不能禁用超级管理员');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('不能修改超级管理员角色');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        role: true,
      },
    });
  }

  async adjustUserBalance(userId: string, amount: number, reason: string) {
    if (amount === 0) {
      throw new BadRequestException('调整金额不能为0');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const newBalance = Number(user.balance) + amount;
    if (newBalance < 0) {
      throw new BadRequestException('余额不足');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
      select: {
        id: true,
        balance: true,
      },
    });
  }

  async adjustUserPoints(userId: string, points: number, reason: string) {
    if (points === 0) {
      throw new BadRequestException('调整积分不能为0');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const newPoints = user.point + points;
    if (newPoints < 0) {
      throw new BadRequestException('积分不足');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { point: newPoints },
      select: {
        id: true,
        point: true,
      },
    });
  }
}
