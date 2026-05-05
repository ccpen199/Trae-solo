import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

export interface RegisterInput {
  username: string;
  password: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    phone?: string;
    email?: string;
  };
}

export class UserService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({
      where: { username: input.username },
    });

    if (existingUser) {
      throw new Error('用户名已存在');
    }

    if (input.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: input.phone },
      });
      if (existingPhone) {
        throw new Error('手机号已被注册');
      }
    }

    if (input.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingEmail) {
        throw new Error('邮箱已被注册');
      }
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: input.username,
          passwordHash,
          name: input.name,
          phone: input.phone,
          email: input.email,
        },
      });

      await tx.accountBalance.create({
        data: {
          userId: newUser.id,
          available: 0,
          frozen: 0,
          totalIncome: 0,
        },
      });

      await tx.fundShare.create({
        data: {
          userId: newUser.id,
          totalShares: 0,
          availableShares: 0,
          frozenShares: 0,
          nav: 1.0,
        },
      });

      return newUser;
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone || undefined,
        email: user.email || undefined,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { username: input.username },
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone || undefined,
        email: user.email || undefined,
      },
    };
  }

  async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }
}

export default new UserService();
