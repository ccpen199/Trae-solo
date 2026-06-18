import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger, { auditLogger } from '../utils/logger';
import config from '../config';

const router = Router();

router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { phone, idCardLast4, verifyCode, authType } = req.body;

    if (!phone && !idCardLast4) {
      throw new AppError('请提供手机号或身份证后4位', 400, { errorCode: 'PARAM_MISSING' });
    }

    if (!verifyCode) {
      throw new AppError('请输入验证码', 400, { errorCode: 'VERIFY_CODE_MISSING' });
    }

    if (verifyCode !== '123456' && verifyCode.length !== 6) {
      throw new AppError('验证码错误或已过期', 401, { errorCode: 'VERIFY_CODE_INVALID' });
    }

    const citizenId = `CIT-${phone ? phone.slice(-6) : uuidv4().substr(0, 8)}`;
    const userId = uuidv4();

    const token = generateToken({
      userId,
      citizenId,
      role: 'citizen',
      extra: { authType: authType || 'sms', loginTime: new Date().toISOString() }
    });

    auditLogger.citizenAction(citizenId, 'login', authType);
    logger.info(`[Auth] 用户登录成功: ${citizenId}, 方式: ${authType || 'sms'}`);

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresIn: 7 * 24 * 3600,
        user: {
          id: userId,
          citizenId,
          phone: phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : undefined,
          verifiedLevel: 'L3'
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/send-verify-code', async (req: Request, res: Response, next) => {
  try {
    const { phone, idCard, type } = req.body;

    if (!phone && !idCard) {
      throw new AppError('请提供手机号或身份证号', 400);
    }

    logger.info(`[Auth] 发送验证码: ${phone ? '手机号' : '身份证'}, 用途: ${type || 'login'}`);

    setTimeout(() => {
      logger.debug(`[Auth] 模拟验证码: 123456 (开发环境固定值)`);
    }, 100);

    res.json({
      code: 0,
      message: '验证码已发送',
      data: {
        sent: true,
        expiresIn: 300,
        mockCode: config.isDev ? '123456' : undefined,
        deliveryChannel: phone ? 'sms' : 'app_push'
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('refreshToken不能为空', 400);

    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(refreshToken, config.jwt.secret);

    const newToken = generateToken({
      userId: payload.sub,
      citizenId: payload.citizenId,
      role: payload.role || 'citizen'
    });

    res.json({
      code: 0,
      message: 'Token刷新成功',
      data: {
        accessToken: newToken.accessToken,
        expiresIn: 7 * 24 * 3600
      },
      requestId: (req as any).requestId
    });

  } catch (err: any) {
    next(new AppError('refreshToken无效或已过期', 401, { errorCode: 'REFRESH_TOKEN_INVALID' }));
  }
});

router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    auditLogger.citizenAction(req.citizenId || 'anonymous', 'logout');
    logger.info(`[Auth] 用户登出: ${req.citizenId}`);

    res.json({
      code: 0,
      message: '已安全退出登录',
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    res.json({
      code: 0,
      message: 'OK',
      data: {
        userId: req.userId,
        citizenId: req.citizenId,
        role: req.role,
        tokenPayload: req.tokenPayload,
        authTime: new Date(req.tokenPayload?.iat * 1000).toISOString()
      },
      requestId: (req as any).requestId
    });
  } catch (err) { next(err); }
});

export default router;
