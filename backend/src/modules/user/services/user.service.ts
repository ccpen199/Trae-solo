import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Role } from '../../common/enums';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: Role) {
    const where = role ? { role } : {};
    return this.prisma.user.findMany({
      where,
      include: { virtualAccount: true },
      omit: { password: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { virtualAccount: true },
      omit: { password: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        realName: data.realName,
        phone: data.phone,
        email: data.email,
        avatar: data.avatar,
      },
      omit: { password: true },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      omit: { password: true },
    });
  }

  async getFarmers(activeOnly: boolean = true) {
    const where = {
      role: Role.FARMER,
      ...(activeOnly && { isActive: true }),
    };

    return this.prisma.user.findMany({
      where,
      include: { virtualAccount: true },
      omit: { password: true },
    });
  }

  async getBuyers(activeOnly: boolean = true) {
    const where = {
      role: Role.BUYER,
      ...(activeOnly && { isActive: true }),
    };

    return this.prisma.user.findMany({
      where,
      include: { virtualAccount: true },
      omit: { password: true },
    });
  }
}
