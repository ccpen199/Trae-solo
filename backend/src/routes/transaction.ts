import { Router, Response } from 'express';
import { asyncHandler, BadRequestError, NotFoundError } from '@middleware/errorHandler';
import { AuthRequest, authMiddleware, studentOnly, investorOnly } from '@middleware/auth';
import { transactionService } from '@services/transactionService';

const router = Router();

router.use(authMiddleware);

router.get('/', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    pageSize = 20,
    type,
    status,
    startDate,
    endDate,
    deviceId,
  } = req.query;

  const result = await transactionService.queryTransactions({
    userId: req.userId,
    deviceId: deviceId as string,
    type: type as any,
    status: status as any,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: Number(page),
    pageSize: Number(pageSize),
  });

  res.json({
    success: true,
    data: {
      transactions: result.transactions,
      total: result.total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  });
}));

router.get('/statistics', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw BadRequestError('请提供开始日期和结束日期');
  }

  const stats = await transactionService.getTransactionStatistics({
    investorId: req.userRole === 'investor' || req.userRole === 'admin' ? req.userId : undefined,
    startDate: new Date(startDate as string),
    endDate: new Date(endDate as string),
  });

  res.json({
    success: true,
    data: stats,
  });
}));

router.get('/bill/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw BadRequestError('账单ID不能为空');
  }

  try {
    const transaction = await transactionService.getTransactionById(id);

    if (transaction.userId?.toString() !== req.userId && req.userRole !== 'admin') {
      throw BadRequestError('无权访问该账单');
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    throw NotFoundError('账单不存在');
  }
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw BadRequestError('交易ID不能为空');
  }

  try {
    const transaction = await transactionService.getTransactionById(id);

    if (transaction.userId?.toString() !== req.userId && req.userRole !== 'admin') {
      throw BadRequestError('无权访问该交易记录');
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    throw NotFoundError('交易记录不存在');
  }
}));

export default router;
