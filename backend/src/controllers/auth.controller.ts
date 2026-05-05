import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { config } from '../config';
import { ApiError } from '../middleware/error';
import { AuthRequest, UserRole } from '../middleware/auth';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BANNED';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6).max(100),
  nickname: z.string().optional(),
  role: z.enum(['MEMBER', 'DEALER']).default('MEMBER'),
  dealerCompany: z.string().optional(),
  dealerLicense: z.string().optional(),
  dealerRegion: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const passwordHashRounds = 10;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: body.username },
          { email: body.email },
          ...(body.phone ? [{ phone: body.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === body.username) {
        throw new ApiError('用户名已存在', 400);
      }
      if (existingUser.email === body.email) {
        throw new ApiError('邮箱已被注册', 400);
      }
      if (body.phone && existingUser.phone === body.phone) {
        throw new ApiError('手机号已被注册', 400);
      }
    }

    const hashedPassword = await bcrypt.hash(body.password, passwordHashRounds);

    const role = body.role as UserRole;
    const isDealer = role === 'DEALER';

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        phone: body.phone || null,
        password: hashedPassword,
        nickname: body.nickname || body.username,
        role,
        status: isDealer ? 'PENDING' : 'ACTIVE',
        dealerCompany: isDealer ? body.dealerCompany || null : null,
        dealerLicense: isDealer ? body.dealerLicense || null : null,
        dealerRegion: isDealer ? body.dealerRegion || null : null,
        dealerLevel: isDealer ? 1 : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      message: isDealer ? '经销商注册成功，请等待审核' : '注册成功',
      user,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username: body.username },
    });

    if (!user) {
      throw new ApiError('用户名或密码错误', 401);
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('用户名或密码错误', 401);
    }

    if (user.status === 'PENDING') {
      throw new ApiError('账号等待审核中，请稍后再试', 403);
    }

    if (user.status === 'BANNED') {
      throw new ApiError('账号已被禁用', 403);
    }

    if (user.status === 'INACTIVE') {
      throw new ApiError('账号未激活', 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        dealerLevel: user.dealerLevel,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        dealerCompany: true,
        dealerLicense: true,
        dealerRegion: true,
        dealerLevel: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new ApiError('用户不存在', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { nickname, avatar, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      message: '更新成功',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ApiError('请提供旧密码和新密码', 400);
    }

    if (newPassword.length < 6) {
      throw new ApiError('新密码长度至少6位', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new ApiError('用户不存在', 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError('旧密码错误', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, passwordHashRounds);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    next(error);
  }
};
