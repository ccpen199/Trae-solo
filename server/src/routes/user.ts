import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { success, error } from '../utils/response';
import { updateProfileValidation, changePasswordValidation } from '../utils/validation';
import { logOperation, getClientIp, getUserAgent } from '../utils/operationLog';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    return success(res, {
      id: user.id,
      account: user.account,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (err) {
    console.error('获取用户资料错误:', err);
    return error(res, '获取用户资料失败');
  }
});

router.put('/profile', authMiddleware, updateProfileValidation, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { nickname, email, phone, avatar } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return error(res, '用户不存在', 404);
    }

    const existingByEmail = email
      ? await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        })
      : null;

    if (existingByEmail) {
      return error(res, '邮箱已被其他账号使用');
    }

    const existingByPhone = phone
      ? await prisma.user.findFirst({
          where: {
            phone,
            NOT: { id: userId },
          },
        })
      : null;

    if (existingByPhone) {
      return error(res, '手机号已被其他账号使用');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: nickname ?? existingUser.nickname,
        email: email !== undefined ? email : existingUser.email,
        phone: phone !== undefined ? phone : existingUser.phone,
        avatar: avatar !== undefined ? avatar : existingUser.avatar,
      },
      include: { role: true },
    });

    await logOperation({
      userId,
      operation: '更新资料',
      module: '用户',
      targetId: userId,
      targetType: 'User',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `用户 ${existingUser.account} 更新了个人资料`,
    });

    return success(res, {
      id: updatedUser.id,
      account: updatedUser.account,
      nickname: updatedUser.nickname,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      status: updatedUser.status,
    }, '资料更新成功');
  } catch (err) {
    console.error('更新用户资料错误:', err);
    return error(res, '更新资料失败');
  }
});

router.post('/change-password', authMiddleware, changePasswordValidation, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    const isOldPasswordValid = await comparePassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      return error(res, '原密码错误');
    }

    if (oldPassword === newPassword) {
      return error(res, '新密码不能与原密码相同');
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return error(res, passwordValidation.errors.join('; '));
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await logOperation({
      userId,
      operation: '修改密码',
      module: '用户',
      targetId: userId,
      targetType: 'User',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `用户 ${user.account} 修改了密码`,
    });

    return success(res, null, '密码修改成功');
  } catch (err) {
    console.error('修改密码错误:', err);
    return error(res, '修改密码失败');
  }
});

export { router as userRouter };
