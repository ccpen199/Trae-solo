import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, UnauthorizedError, NotFoundError } from '@middleware/errorHandler';
import { UserService } from '@services/userService';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '@middleware/auth';
import { config } from '@config/index';
import { User, IUser } from '@models/User';
import { logger } from '@utils/logger';

const userService = UserService.getInstance();

export const sendVerificationCode = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { phone, type = 'login' } = req.body;

  if (!phone) {
    throw BadRequestError('手机号不能为空');
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw BadRequestError('手机号格式不正确');
  }

  const validTypes = ['login', 'reset_password', 'bind_phone'];
  if (!validTypes.includes(type)) {
    throw BadRequestError('无效的验证码类型');
  }

  const result = await userService.sendVerificationCode({ phone, type });

  res.json({
    success: true,
    data: { sent: result },
    message: '验证码发送成功',
  });
});

export const loginWithPhone = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { phone, verificationCode } = req.body;

  if (!phone) {
    throw BadRequestError('手机号不能为空');
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw BadRequestError('手机号格式不正确');
  }

  if (!verificationCode) {
    throw BadRequestError('验证码不能为空');
  }

  if (verificationCode.length !== 6) {
    throw BadRequestError('验证码格式不正确');
  }

  const loginResult = await userService.login({ phone, verificationCode });

  const user = loginResult.user as IUser;
  const token = generateToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString(), user.role);

  await User.findByIdAndUpdate(user._id, {
    $set: {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip || req.socket.remoteAddress,
    },
  });

  logger.info(`用户登录成功: phone=${phone}, userId=${user._id}, role=${user.role}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        realName: user.realName,
        avatar: user.avatar,
        role: user.role,
        balance: user.balance,
        isActive: user.isActive,
      },
      token,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    },
    message: '登录成功',
  });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { refreshToken: refreshTokenParam } = req.body;

  if (!refreshTokenParam) {
    throw BadRequestError('刷新令牌不能为空');
  }

  const decoded = verifyRefreshToken(refreshTokenParam);
  if (!decoded) {
    throw UnauthorizedError('刷新令牌无效或已过期');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw NotFoundError('用户不存在');
  }

  if (!user.isActive) {
    throw UnauthorizedError('账户已被禁用');
  }

  const newToken = generateToken(user._id.toString(), user.role);
  const newRefreshToken = generateRefreshToken(user._id.toString(), user.role);

  res.json({
    success: true,
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: config.jwt.expiresIn,
    },
    message: '令牌刷新成功',
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  logger.info(`用户登出: userId=${userId}`);

  res.json({
    success: true,
    data: null,
    message: '登出成功',
  });
});
