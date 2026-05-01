import { Response } from 'express';
import { z } from 'zod';
import { withdrawService } from '../services/withdraw.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { WithdrawStatus, UserRole } from '@prisma/client';

const createWithdrawSchema = z.object({
  body: z.object({
    amount: z.number().int().min(1, '提现金额必须大于0'),
    withdrawMethod: z.enum(['bank', 'alipay']),
    bankInfo: z
      .object({
        bankName: z.string(),
        bankAccount: z.string(),
        bankAccountName: z.string(),
      })
      .optional(),
    alipayInfo: z
      .object({
        account: z.string(),
      })
      .optional(),
  })
    .refine(
      (data) => {
        if (data.withdrawMethod === 'bank') {
          return !!data.bankInfo;
        }
        if (data.withdrawMethod === 'alipay') {
          return !!data.alipayInfo;
        }
        return false;
      },
      {
        message: '请提供对应提现方式的收款信息',
      }
    ),
});

const withdrawIdSchema = z.object({
  params: z.object({
    withdrawId: z.string(),
  }),
});

export const createWithdraw = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  try {
    const validated = createWithdrawSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await withdrawService.createWithdraw({
      userId: req.userId,
      amount: validated.body.amount,
      withdrawMethod: validated.body.withdrawMethod,
      bankInfo: validated.body.bankInfo,
      alipayInfo: validated.body.alipayInfo,
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

export const reviewWithdraw = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  try {
    const schema = z.object({
      params: z.object({ withdrawId: z.string() }),
      body: z.object({
        approved: z.boolean(),
        remark: z.string().optional(),
      }),
    });

    const validated = schema.parse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    const result = await withdrawService.reviewWithdraw({
      withdrawId: validated.params.withdrawId,
      reviewerId: req.userId,
      reviewerRole: req.userRole as UserRole,
      approved: validated.body.approved,
      remark: validated.body.remark,
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

export const processPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = withdrawIdSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    const result = await withdrawService.processPayment(validated.params.withdrawId);
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

export const getUserWithdraws = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const status = req.query.status as WithdrawStatus | undefined;
  const withdraws = await withdrawService.getUserWithdraws(req.userId, status);

  res.status(200).json({
    success: true,
    data: withdraws,
  });
};

export const getPendingWithdraws = async (req: AuthenticatedRequest, res: Response) => {
  const withdraws = await withdrawService.getPendingWithdraws();

  res.status(200).json({
    success: true,
    data: withdraws,
  });
};
