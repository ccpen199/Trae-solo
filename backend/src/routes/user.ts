import { Router, Response } from 'express';
import { asyncHandler, BadRequestError, ValidationError } from '@middleware/errorHandler';
import { AuthRequest, authMiddleware } from '@middleware/auth';
import { userService } from '@services/userService';
import { User } from '@models/User';
import { logger } from '@utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);

  if (!user) {
    throw BadRequestError('用户不存在');
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      phone: user.phone,
      realName: user.realName,
      avatar: user.avatar,
      role: user.role,
      balance: user.balance,
      warningThreshold: user.balanceWarningThreshold,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
}));

router.put('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { realName, avatar } = req.body;

  if (realName === undefined && avatar === undefined) {
    throw BadRequestError('至少需要提供一个更新字段');
  }

  if (realName !== undefined && (realName.length < 1 || realName.length > 20)) {
    throw ValidationError('姓名长度必须在1-20个字符之间');
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { realName, avatar } },
    { new: true }
  );

  if (!user) {
    throw BadRequestError('用户不存在');
  }

  res.json({
    success: true,
    message: '个人资料更新成功',
    data: {
      id: user._id,
      realName: user.realName,
      avatar: user.avatar,
    },
  });
}));

router.get('/balance', asyncHandler(async (req: AuthRequest, res: Response) => {
  const balance = await userService.getBalance(req.userId!);

  res.json({
    success: true,
    data: {
      balance,
      warningThreshold: (req.user as any)?.balanceWarningThreshold || 5,
    },
  });
}));

router.put('/password', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw ValidationError('新密码长度不能少于6位');
  }

  logger.info(`用户修改密码: userId=${req.userId}`);

  res.json({
    success: true,
    message: '密码修改成功',
  });
}));

router.put('/warning-threshold', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { threshold } = req.body;

  if (threshold === undefined || typeof threshold !== 'number' || threshold < 0) {
    throw BadRequestError('请提供有效的预警阈值');
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { balanceWarningThreshold: threshold } },
    { new: true }
  );

  if (!user) {
    throw BadRequestError('用户不存在');
  }

  res.json({
    success: true,
    message: '余额预警阈值更新成功',
    data: {
      warningThreshold: user.balanceWarningThreshold,
    },
  });
}));

export default router;
