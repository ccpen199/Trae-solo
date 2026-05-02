import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthRequest, generateToken, generateRefreshToken, verifyToken, authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { sendSuccess, sendCreated } from '../utils/response';
import { UnauthorizedError, NotFoundError, BadRequestError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config';

const prisma = new PrismaClient();
const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh Token不能为空'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '原密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6位'),
});

router.post(
  '/login',
  asyncHandler(async (req, res: Response) => {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        username: validated.username,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    const passwordMatch = await bcrypt.compare(validated.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokenPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      username: user.username,
      role: user.role,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    logger.info('用户登录成功', {
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        gender: user.gender,
        organizationId: user.organizationId,
      },
      token,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res: Response) => {
    const validated = refreshTokenSchema.parse(req.body);

    try {
      const payload = verifyToken(validated.refreshToken);

      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          organizationId: payload.organizationId,
          isActive: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('用户不存在或已禁用');
      }

      const tokenPayload = {
        userId: user.id,
        organizationId: user.organizationId,
        username: user.username,
        role: user.role,
      };

      const newToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      logger.info('Token刷新成功', { userId: user.id });

      sendSuccess(res, {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: config.jwt.expiresIn,
      });
    } catch (error) {
      throw new UnauthorizedError('Refresh Token无效或已过期');
    }
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      include: {
        teacherProfile: true,
        studentProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    sendSuccess(res, {
      id: user.id,
      username: user.username,
      realName: user.realName,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      gender: user.gender,
      birthDate: user.birthDate,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      teacherProfile: user.teacherProfile,
      studentProfile: user.studentProfile,
      parentProfile: user.parentProfile,
      createdAt: user.createdAt,
    });
  })
);

router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = changePasswordSchema.parse(req.body);
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const passwordMatch = await bcrypt.compare(validated.oldPassword, user.passwordHash);

    if (!passwordMatch) {
      throw new BadRequestError('原密码错误');
    }

    const newPasswordHash = await bcrypt.hash(validated.newPassword, config.bcrypt.saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    logger.info('密码修改成功', { userId });

    sendSuccess(res, { message: '密码修改成功' });
  })
);

export default router;
