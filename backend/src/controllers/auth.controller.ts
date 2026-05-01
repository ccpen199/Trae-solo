import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    password: z.string().min(6, '密码至少6位'),
    nickname: z.string().optional(),
    referralCode: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    password: z.string().min(1, '请输入密码'),
  }),
});

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await authService.register({
      ...validated.body,
      ip: req.ip,
      deviceId: req.headers['x-device-id'] as string,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await authService.login({
      ...validated.body,
      ip: req.ip,
      deviceId: req.headers['x-device-id'] as string,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: error.errors,
      });
    }
    throw error;
  }
};

export const applyDistributor = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const result = await authService.applyDistributor(req.userId);
  res.status(200).json(result);
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const user = await authService.getUserById(req.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在',
    });
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      distributorId: user.distributorId,
      referralCode: user.referralCode,
      distributorStatus: user.distributorStatus,
      joinDate: user.joinDate,
      virtualAccount: user.virtualAccount
        ? {
            totalBalance: user.virtualAccount.totalBalance.toNumber(),
            frozenBalance: user.virtualAccount.frozenBalance.toNumber(),
            availableBalance: user.virtualAccount.availableBalance.toNumber(),
            totalEarnings: user.virtualAccount.totalEarnings.toNumber(),
            totalWithdrawn: user.virtualAccount.totalWithdrawn.toNumber(),
          }
        : null,
    },
  });
};
