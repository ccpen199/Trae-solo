import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { Role, Gender } from '@hospital/shared';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: { doctor: true },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async create(data: {
    username: string;
    password: string;
    name: string;
    role?: Role;
    email?: string;
    phone?: string;
    gender?: Gender;
    birthDate?: Date;
    idNumber?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }): Promise<User> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new ConflictException('用户名已存在');
      }
      if (data.email && existingUser.email === data.email) {
        throw new ConflictException('邮箱已被注册');
      }
      if (data.phone && existingUser.phone === data.phone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: data.role || Role.PATIENT,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate,
        idNumber: data.idNumber,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
      },
    });

    this.logger.log(`用户 ${user.username} 创建成功，角色: ${user.role}`);

    return user;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      gender: Gender;
      birthDate: Date;
      idNumber: string;
      address: string;
      emergencyContact: string;
      emergencyPhone: string;
      isActive: boolean;
    }>,
  ): Promise<User> {
    const user = await this.findById(id);

    const updateData: any = { ...data };

    if (data.email && data.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existingUser) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    if (data.phone && data.phone !== user.phone) {
      const existingUser = await this.prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id } },
      });
      if (existingUser) {
        throw new ConflictException('手机号已被使用');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`用户 ${id} 更新成功`);

    return updatedUser;
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string): Promise<User> {
    const user = await this.findById(id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new ConflictException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    this.logger.log(`用户 ${id} 密码更新成功`);

    return updatedUser;
  }

  async resetPassword(id: string, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    this.logger.log(`用户 ${id} 密码重置成功`);

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);

    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`用户 ${user.username} 已删除`);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async findByRole(role: Role): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(query: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByRole(): Promise<{ role: string; count: number }[]> {
    const result = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    return result.map((item) => ({
      role: item.role,
      count: item._count.id,
    }));
  }
}
