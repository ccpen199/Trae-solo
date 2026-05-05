import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';
import { cache } from '../lib/redis';

export class UserService {
  private static readonly SALT_ROUNDS = 10;

  static async register(username: string, password: string, nickname?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        nickname: nickname || username,
        avatar: null,
        status: 1,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new Error('用户已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    const token = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    await cache.set(`user:session:${user.id}`, token, { EX: 7 * 24 * 60 * 60 });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }

  static async logout(userId: string) {
    await cache.del(`user:session:${userId}`);
    return true;
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, status: 1 },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  static async updateProfile(
    userId: string,
    data: {
      nickname?: string;
      avatar?: string;
      email?: string;
    }
  ) {
    const updateData: any = {};
    if (data.nickname) updateData.nickname = data.nickname;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.email !== undefined) updateData.email = data.email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        email: true,
      },
    });

    return user;
  }

  static async getById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId, status: 1 },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    });
  }

  static async listByIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    
    return prisma.user.findMany({
      where: { id: { in: userIds }, status: 1 },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    });
  }
}
