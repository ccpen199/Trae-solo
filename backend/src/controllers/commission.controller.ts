import { Response } from 'express';
import { z } from 'zod';
import { commissionService } from '../services/commission.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { CommissionStatus } from '@prisma/client';

export const getCommissionStats = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const stats = await commissionService.getCommissionStats(req.userId);

  res.status(200).json({
    success: true,
    data: stats,
  });
};

export const getCommissions = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const status = req.query.status as CommissionStatus | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (req.query.startDate) {
    startDate = new Date(req.query.startDate as string);
  }
  if (req.query.endDate) {
    endDate = new Date(req.query.endDate as string);
  }

  const result = await commissionService.getCommissions({
    userId: req.userId,
    status,
    startDate,
    endDate,
    page,
    pageSize,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const type = req.query.type as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (req.query.startDate) {
    startDate = new Date(req.query.startDate as string);
  }
  if (req.query.endDate) {
    endDate = new Date(req.query.endDate as string);
  }

  const result = await commissionService.getTransactions({
    userId: req.userId,
    type,
    startDate,
    endDate,
    page,
    pageSize,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

export const getPerformanceStats = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }

  const period = (req.query.period as 'day' | 'week' | 'month' | 'total') || 'month';

  const stats = await commissionService.getPerformanceStats(req.userId, period);

  res.status(200).json({
    success: true,
    data: stats,
  });
};

export const getSettlementReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      query: z.object({
        startDate: z.string().transform((s) => new Date(s)),
        endDate: z.string().transform((s) => new Date(s)),
        userId: z.string().optional(),
        page: z.string().optional().transform((s) => (s ? parseInt(s) : 1)),
        pageSize: z.string().optional().transform((s) => (s ? parseInt(s) : 50)),
      }),
    });

    const validated = schema.parse({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    const result = await commissionService.getSettlementReport({
      startDate: validated.query.startDate,
      endDate: validated.query.endDate,
      userId: validated.query.userId,
      page: validated.query.page,
      pageSize: validated.query.pageSize,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
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
