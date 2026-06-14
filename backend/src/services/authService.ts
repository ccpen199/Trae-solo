import { User } from "../../generated/prisma";
import { UserRole, UserStatus } from "../types/enums";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config";
import logger from "../utils/logger";
import encryptionService from "./encryptionService";
import prisma from "../lib/prisma";

interface RegisterParams {
  phone: string;
  name: string;
  idCard: string;
  email?: string;
  password: string;
  role?: UserRole;
}

interface LoginParams {
  phone: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  role: string;
}

class AuthService {
  async register(params: RegisterParams): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { phone: params.phone },
    });

    if (existingUser) {
      throw new Error("手机号已注册");
    }

    if (params.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: params.email },
      });
      if (existingEmail) {
        throw new Error("邮箱已注册");
      }
    }

    const passwordHash = await bcrypt.hash(params.password, 12);
    const idCardEncrypted = encryptionService.encrypt(params.idCard);

    const user = await prisma.user.create({
      data: {
        phone: params.phone,
        name: params.name,
        idCardEncrypted,
        email: params.email,
        passwordHash,
        role: params.role || UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });

    logger.info("用户注册成功", { userId: user.id, phone: user.phone });
    return user;
  }

  async login(params: LoginParams): Promise<{ user: User; token: string }> {
    const user = await prisma.user.findUnique({
      where: { phone: params.phone },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error("账号未激活或已被禁用");
    }

    const isValidPassword = await bcrypt.compare(params.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("密码错误");
    }

    const token = this.generateToken({ userId: user.id, role: user.role as string });

    logger.info("用户登录成功", { userId: user.id, phone: user.phone });
    return { user, token };
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
      throw new Error("无效的令牌");
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("原密码错误");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    logger.info("用户密码修改成功", { userId });
  }
}

export default new AuthService();
