import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, UserRole } from '@prisma/client';
import prisma from '../config/prisma';
import redis from '../config/redis';
import { config } from '../config';

export interface RegisterParams {
  phone: string;
  password: string;
  nickname?: string;
  referralCode?: string;
  ip?: string;
  deviceId?: string;
}

export interface LoginParams {
  phone: string;
  password: string;
  ip?: string;
  deviceId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    phone: string;
    nickname: string | null;
    role: UserRole;
    distributorId: string | null;
    referralCode: string | null;
    distributorStatus: string | null;
  };
  token?: string;
  message?: string;
}

export class AuthService {
  private prisma: PrismaClient;
  private readonly SALT_ROUNDS = 10;
  private readonly TOKEN_PREFIX = 'auth:token:';

  constructor() {
    this.prisma = prisma;
  }

  async register(params: RegisterParams): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: params.phone },
    });

    if (existingUser) {
      return {
        success: false,
        message: '该手机号已注册',
      };
    }

    const passwordHash = await bcrypt.hash(params.password, this.SALT_ROUNDS);

    const distributorId = this.generateDistributorId();
    const referralCode = this.generateReferralCode();

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phone: params.phone,
          passwordHash,
          nickname: params.nickname || `用户${params.phone.slice(-4)}`,
          role: 'END_USER',
          registerIp: params.ip,
          registerDevice: params.deviceId,
        },
      });

      await tx.virtualAccount.create({
        data: {
          userId: newUser.id,
          totalBalance: 0,
          frozenBalance: 0,
          availableBalance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0,
        },
      });

      return newUser;
    });

    if (params.referralCode) {
      await this.processReferral(user.id, params.referralCode);
    }

    const token = this.generateToken(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
        distributorId: user.distributorId,
        referralCode: user.referralCode,
        distributorStatus: user.distributorStatus,
      },
      token,
    };
  }

  async login(params: LoginParams): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { phone: params.phone },
    });

    if (!user) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    const passwordValid = await bcrypt.compare(params.password, user.passwordHash);
    if (!passwordValid) {
      return {
        success: false,
        message: '密码错误',
      };
    }

    const token = this.generateToken(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
        distributorId: user.distributorId,
        referralCode: user.referralCode,
        distributorStatus: user.distributorStatus,
      },
      token,
    };
  }

  async applyDistributor(userId: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    if (user.distributorStatus === 'ACTIVE') {
      return {
        success: false,
        message: '您已经是分销员了',
      };
    }

    const distributorId = this.generateDistributorId();
    const referralCode = this.generateReferralCode();

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'DISTRIBUTOR',
        distributorId,
        referralCode,
        joinDate: new Date(),
        distributorStatus: 'ACTIVE',
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        nickname: updatedUser.nickname,
        role: updatedUser.role,
        distributorId: updatedUser.distributorId,
        referralCode: updatedUser.referralCode,
        distributorStatus: updatedUser.distributorStatus,
      },
    };
  }

  private async processReferral(userId: string, referralCode: string): Promise<void> {
    const referrer = await this.prisma.user.findFirst({
      where: {
        referralCode,
        distributorStatus: 'ACTIVE',
      },
    });

    if (!referrer) {
      return;
    }

    await this.prisma.distributionRelation.create({
      data: {
        parentId: referrer.id,
        childId: userId,
        level: 1,
        status: 'ACTIVE',
        joinTime: new Date(),
      },
    });

    let currentReferrer = referrer;
    let level = 2;

    while (level <= config.DISTRIBUTION_MAX_LEVEL) {
      const parentRelation = await this.prisma.distributionRelation.findFirst({
        where: { childId: currentReferrer.id },
        include: { parent: true },
      });

      if (!parentRelation || parentRelation.parent.distributorStatus !== 'ACTIVE') {
        break;
      }

      await this.prisma.distributionRelation.create({
        data: {
          parentId: parentRelation.parentId,
          childId: userId,
          level,
          status: 'ACTIVE',
          joinTime: new Date(),
        },
      });

      currentReferrer = parentRelation.parent;
      level++;
    }
  }

  private generateToken(userId: string): string {
    const token = jwt.sign(
      { userId, iat: Date.now() },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    return token;
  }

  private generateDistributorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `D${timestamp}${random}`.toUpperCase();
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async validateToken(token: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      return null;
    }
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        virtualAccount: true,
      },
    });
  }
}

export const authService = new AuthService();
