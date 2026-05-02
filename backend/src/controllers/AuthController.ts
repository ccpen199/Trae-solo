import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '../constants/enums';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { generateToken } from '../middleware/auth';
import { NotFoundError, ValidationError, AppError } from '../errors/AppError';
import { asyncHandler } from '../middleware/errorHandler';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { username, email, password, phone, role = UserRole.GUEST } = req.body as RegisterInput;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ValidationError('邮箱已被注册', { field: 'email' });
      }
      throw new ValidationError('用户名已被使用', { field: 'username' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phone,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    logger.info(`User registered: ${user.username} (${user.role})`, {
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  });

  login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ValidationError('邮箱或密码错误', { field: 'credentials' });
    }

    if (!user.isActive) {
      throw new AppError('账户已被禁用', 403, 'ACCOUNT_DISABLED');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ValidationError('邮箱或密码错误', { field: 'credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    logger.info(`User logged in: ${user.username} (${user.role})`, {
      userId: user.id,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    });
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        realName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  updateProfile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { username, phone, avatar, realName } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: { not: req.user.userId },
      },
    });

    if (existingUser) {
      throw new ValidationError('用户名已被使用', { field: 'username' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        username,
        phone,
        avatar,
        realName,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        realName: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info(`User updated profile: ${req.user.userId}`);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  changePassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new ValidationError('当前密码错误', { field: 'currentPassword' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        password: hashedNewPassword,
      },
    });

    logger.info(`User changed password: ${req.user.userId}`);

    res.status(200).json({
      status: 'success',
      message: '密码修改成功',
    });
  });
}

export const authController = new AuthController();
export default authController;
