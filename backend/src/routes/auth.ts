import { Router, Request, Response } from 'express';
import { asyncHandler, BadRequestError, UnauthorizedError } from '@middleware/errorHandler';
import { AuthRequest, generateToken, generateRefreshToken, verifyRefreshToken } from '@middleware/auth';
import { userService } from '@services/userService';
import { logger } from '@utils/logger';

const router = Router();

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { phone, verificationCode } = req.body;

  if (!phone || !verificationCode) {
    throw BadRequestError('手机号和验证码不能为空');
  }

  const result = await userService.login({ phone, verificationCode });

  const accessToken = generateToken(result.user._id.toString(), result.user.role);
  const refreshToken = generateRefreshToken(result.user._id.toString(), result.user.role);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: result.user._id,
        phone: result.user.phone,
        realName: result.user.realName,
        avatar: result.user.avatar,
        role: result.user.role,
        balance: result.user.balance,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    },
  });
}));

router.post('/send-code', asyncHandler(async (req: Request, res: Response) => {
  const { phone, type } = req.body;

  if (!phone) {
    throw BadRequestError('手机号不能为空');
  }

  const codeType = type || 'login';
  const result = await userService.sendVerificationCode({ phone, type: codeType });

  res.json({
    success: true,
    message: '验证码发送成功',
    data: {
      sent: result,
      expiresIn: 5 * 60,
    },
  });
}));

router.post('/refresh-token', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw BadRequestError('刷新令牌不能为空');
  }

  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    throw UnauthorizedError('无效的刷新令牌');
  }

  const accessToken = generateToken(decoded.userId, decoded.role);
  const newRefreshToken = generateRefreshToken(decoded.userId, decoded.role);

  res.json({
    success: true,
    message: '令牌刷新成功',
    data: {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    },
  });
}));

router.post('/logout', asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`用户登出: userId=${req.userId}`);

  res.json({
    success: true,
    message: '登出成功',
  });
}));

export default router;
