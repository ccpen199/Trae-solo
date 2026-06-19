import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '@middleware/errorHandler';
import { UserService } from '@services/userService';
import { User, IUser } from '@models/User';
import { logger } from '@utils/logger';

const userService = UserService.getInstance();

export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  const user = await userService.getUserById(userId);

  res.json({
    success: true,
    data: {
      id: user._id,
      phone: user.phone,
      realName: user.realName,
      avatar: user.avatar,
      role: user.role,
      balance: user.balance,
      frozenBalance: user.frozenBalance,
      availableBalance: (user as any).availableBalance,
      balanceWarningThreshold: user.balanceWarningThreshold,
      studentInfo: user.studentInfo,
      operatorInfo: user.operatorInfo,
      investorInfo: user.investorInfo,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
    message: '获取用户信息成功',
  });
});

export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { realName, avatar, studentInfo } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  const updateData: any = {};

  if (avatar !== undefined) {
    if (typeof avatar !== 'string') {
      throw BadRequestError('头像格式不正确');
    }
    updateData.avatar = avatar;
  }

  if (realName !== undefined) {
    if (typeof realName !== 'string' || realName.length < 2 || realName.length > 20) {
      throw BadRequestError('真实姓名长度必须在2-20个字符之间');
    }
    updateData.realName = realName.trim();
  }

  if (studentInfo !== undefined) {
    if (typeof studentInfo !== 'object') {
      throw BadRequestError('学生信息格式不正确');
    }
    updateData.studentInfo = {
      ...((req.user as IUser)?.studentInfo || {}),
      ...studentInfo,
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  );

  if (!updatedUser) {
    throw NotFoundError('用户不存在');
  }

  logger.info(`用户信息更新成功: userId=${userId}`);

  res.json({
    success: true,
    data: {
      id: updatedUser._id,
      phone: updatedUser.phone,
      realName: updatedUser.realName,
      avatar: updatedUser.avatar,
      studentInfo: updatedUser.studentInfo,
    },
    message: '用户信息更新成功',
  });
});

export const getUserBalance = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  const balance = await userService.getBalance(userId);
  const user = await User.findById(userId).select('balance frozenBalance balanceWarningThreshold');

  if (!user) {
    throw NotFoundError('用户不存在');
  }

  const isLowBalance = balance < (user.balanceWarningThreshold || 5);

  res.json({
    success: true,
    data: {
      balance,
      frozenBalance: user.frozenBalance || 0,
      availableBalance: balance - (user.frozenBalance || 0),
      warningThreshold: user.balanceWarningThreshold || 5,
      isLowBalance,
      warningMessage: isLowBalance ? `余额不足${user.balanceWarningThreshold || 5}元，请及时充值` : null,
    },
    message: '获取余额成功',
  });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!oldPassword) {
    throw BadRequestError('原密码不能为空');
  }

  if (!newPassword) {
    throw BadRequestError('新密码不能为空');
  }

  if (newPassword.length < 6 || newPassword.length > 32) {
    throw BadRequestError('密码长度必须在6-32个字符之间');
  }

  if (newPassword !== confirmPassword) {
    throw BadRequestError('两次输入的新密码不一致');
  }

  if (oldPassword === newPassword) {
    throw BadRequestError('新密码不能与原密码相同');
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw NotFoundError('用户不存在');
  }

  if (!user.password) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { password: newPassword } },
      { new: true }
    );

    logger.info(`用户设置密码成功: userId=${userId}`);

    res.json({
      success: true,
      data: null,
      message: '密码设置成功',
    });
    return;
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw BadRequestError('原密码不正确');
  }

  await User.findByIdAndUpdate(
    userId,
    { $set: { password: newPassword } },
    { new: true }
  );

  logger.info(`用户修改密码成功: userId=${userId}`);

  res.json({
    success: true,
    data: null,
    message: '密码修改成功',
  });
});

export const getBalanceRecords = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { page = 1, pageSize = 20, type } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  const pageNum = parseInt(page as string, 10);
  const sizeNum = parseInt(pageSize as string, 10);

  if (pageNum < 1) {
    throw BadRequestError('页码必须大于0');
  }

  if (sizeNum < 1 || sizeNum > 100) {
    throw BadRequestError('每页数量必须在1-100之间');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw NotFoundError('用户不存在');
  }

  let records = (user as any).balanceRecords || [];

  if (type) {
    records = records.filter((r: any) => r.type === type);
  }

  records = records.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = records.length;
  const paginatedRecords = records.slice((pageNum - 1) * sizeNum, pageNum * sizeNum);

  res.json({
    success: true,
    data: {
      records: paginatedRecords,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
    },
    message: '获取余额记录成功',
  });
});

export const updateBalanceWarningThreshold = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { threshold } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (threshold === undefined || threshold === null) {
    throw BadRequestError('预警阈值不能为空');
  }

  const thresholdNum = parseFloat(threshold);
  if (isNaN(thresholdNum) || thresholdNum < 0) {
    throw BadRequestError('预警阈值必须是非负数');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { balanceWarningThreshold: thresholdNum } },
    { new: true }
  );

  if (!updatedUser) {
    throw NotFoundError('用户不存在');
  }

  res.json({
    success: true,
    data: {
      balanceWarningThreshold: updatedUser.balanceWarningThreshold,
    },
    message: '余额预警阈值更新成功',
  });
});
