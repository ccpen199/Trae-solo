import { Router, Response } from 'express';
import { RoleCode, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { success, error, unauthorized } from '../utils/response';
import { registerValidation, loginValidation } from '../utils/validation';
import { logOperation, getClientIp, getUserAgent } from '../utils/operationLog';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', registerValidation, async (req: AuthRequest, res: Response) => {
  try {
    const { account, password, nickname, email, phone } = req.body;

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return error(res, passwordValidation.errors.join('; '));
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { account },
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.account === account) {
        return error(res, '账号已存在');
      }
      if (email && existingUser.email === email) {
        return error(res, '邮箱已被使用');
      }
      if (phone && existingUser.phone === phone) {
        return error(res, '手机号已被使用');
      }
    }

    const userRole = await prisma.role.findUnique({
      where: { code: RoleCode.USER },
    });

    if (!userRole) {
      return error(res, '系统错误，请稍后重试');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        account,
        passwordHash,
        nickname,
        email: email || null,
        phone: phone || null,
        status: UserStatus.ACTIVE,
        roleId: userRole.id,
      },
      include: {
        role: true,
      },
    });

    const token = generateToken(user.id, user.role.code);

    await logOperation({
      userId: user.id,
      operation: '注册',
      module: '认证',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `用户 ${account} 注册成功`,
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        account: user.account,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    }, '注册成功');
  } catch (err) {
    console.error('注册错误:', err);
    return error(res, '注册失败，请稍后重试');
  }
});

router.post('/login', loginValidation, async (req: AuthRequest, res: Response) => {
  try {
    const { account, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { account },
          { email: account },
          { phone: account },
        ],
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return error(res, '账号或密码错误');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return error(res, '账号或密码错误');
    }

    if (user.status === UserStatus.SUSPENDED) {
      return unauthorized(res, '账号已被禁用，请联系管理员');
    }

    if (user.status === UserStatus.INACTIVE) {
      return error(res, '账号未激活，请先激活账号');
    }

    const token = generateToken(user.id, user.role.code);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logOperation({
      userId: user.id,
      operation: '登录',
      module: '认证',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `用户 ${user.account} 登录成功`,
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        account: user.account,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    }, '登录成功');
  } catch (err) {
    console.error('登录错误:', err);
    return error(res, '登录失败，请稍后重试');
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await logOperation({
        userId,
        operation: '登出',
        module: '认证',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `用户 ${user.account} 登出`,
      });
    }

    return success(res, null, '登出成功');
  } catch (err) {
    console.error('登出错误:', err);
    return error(res, '登出失败');
  }
});

export { router as authRouter };
