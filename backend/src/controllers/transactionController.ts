import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '@middleware/errorHandler';
import { TransactionService } from '@services/transactionService';
import { DeviceService } from '@services/deviceService';
import { UserService } from '@services/userService';
import { config } from '@config/index';
import { logger } from '@utils/logger';

const transactionService = TransactionService.getInstance();
const deviceService = DeviceService.getInstance();
const userService = UserService.getInstance();

export const getTransactionList = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const {
    page = 1,
    pageSize = 20,
    type,
    status,
    startDate,
    endDate,
    deviceId,
  } = req.query;

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

  const queryParams: any = {
    page: pageNum,
    pageSize: sizeNum,
    type: type as 'recharge' | 'deduct' | 'refund' | 'payment' | undefined,
    status: status as 'pending' | 'success' | 'failed' | 'refunded' | undefined,
    deviceId: deviceId as string,
  };

  if (userRole === 'student') {
    queryParams.userId = userId;
  } else if (userRole === 'investor') {
    queryParams.investorId = userId;
  }

  if (startDate) {
    const start = new Date(startDate as string);
    if (isNaN(start.getTime())) {
      throw BadRequestError('开始日期格式不正确');
    }
    queryParams.startDate = start;
  }

  if (endDate) {
    const end = new Date(endDate as string);
    if (isNaN(end.getTime())) {
      throw BadRequestError('结束日期格式不正确');
    }
    queryParams.endDate = end;
  }

  if (queryParams.startDate && queryParams.endDate && queryParams.startDate >= queryParams.endDate) {
    throw BadRequestError('开始日期必须小于结束日期');
  }

  const { transactions, total } = await transactionService.queryTransactions(queryParams);

  res.json({
    success: true,
    data: {
      transactions,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
    },
    message: '获取交易记录成功',
  });
});

export const getTransactionDetail = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { transactionId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!transactionId) {
    throw BadRequestError('交易ID不能为空');
  }

  const transaction = await transactionService.getTransactionById(transactionId);

  if (!transaction) {
    throw NotFoundError('交易记录不存在');
  }

  if (userRole === 'student') {
    if (transaction.userId?.toString() !== userId) {
      throw ForbiddenError('无权访问该交易记录');
    }
  } else if (userRole === 'investor') {
    if ((transaction as any).investorId?.toString() !== userId) {
      throw ForbiddenError('无权访问该交易记录');
    }
  }

  res.json({
    success: true,
    data: transaction,
    message: '获取交易详情成功',
  });
});

export const getElectronicBill = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const {
    billMonth,
    startDate,
    endDate,
    deviceId,
    format = 'json',
  } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  let queryStart: Date;
  let queryEnd: Date;

  if (billMonth) {
    const monthStr = billMonth as string;
    const [year, month] = monthStr.split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) {
      throw BadRequestError('账期月份格式不正确，应为 YYYY-MM');
    }
    queryStart = new Date(year, month - 1, 1);
    queryEnd = new Date(year, month, 0, 23, 59, 59, 999);
  } else if (startDate && endDate) {
    queryStart = new Date(startDate as string);
    queryEnd = new Date(endDate as string);
    if (isNaN(queryStart.getTime()) || isNaN(queryEnd.getTime())) {
      throw BadRequestError('日期格式不正确');
    }
    queryEnd.setHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    queryStart = new Date(now.getFullYear(), now.getMonth(), 1);
    queryEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  if (queryStart >= queryEnd) {
    throw BadRequestError('开始日期必须小于结束日期');
  }

  const { transactions, total } = await transactionService.queryTransactions({
    userId,
    startDate: queryStart,
    endDate: queryEnd,
    deviceId: deviceId as string,
    type: 'deduct',
    status: 'success',
    page: 1,
    pageSize: 1000,
  });

  const totalWaterVolume = transactions.reduce((sum, t) => sum + (t.waterVolume || 0), 0);
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const deductCount = transactions.filter(t => t.type === 'deduct').length;

  const billNo = `BILL${queryStart.getFullYear()}${String(queryStart.getMonth() + 1).padStart(2, '0')}${userId.slice(-6)}`;

  const billData = {
    billNo,
    billType: 'electronic',
    userId,
    billingPeriod: {
      startDate: queryStart,
      endDate: queryEnd,
      month: `${queryStart.getFullYear()}-${String(queryStart.getMonth() + 1).padStart(2, '0')}`,
    },
    summary: {
      totalTransactions: total,
      deductCount,
      totalWaterVolume,
      totalAmount,
      averagePrice: totalWaterVolume > 0 ? totalAmount / totalWaterVolume : 0,
      waterPricePerLiter: config.business.waterPricePerLiter,
    },
    pricing: {
      waterPricePerLiter: config.business.waterPricePerLiter,
      tieredPricing: [
        { minVolume: 0, maxVolume: 10, unitPrice: 2.0 },
        { minVolume: 10, maxVolume: 20, unitPrice: 3.0 },
        { minVolume: 20, unitPrice: 4.5 },
      ],
    },
    transactions,
    generatedAt: new Date(),
  };

  if (format === 'pdf') {
    res.json({
      success: true,
      data: {
        billNo,
        downloadUrl: `/api/bills/${billNo}/download`,
        billData,
      },
      message: '电子账单生成成功',
    });
    return;
  }

  res.json({
    success: true,
    data: billData,
    message: '获取电子账单成功',
  });
});

export const getTransactionStatistics = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { startDate, endDate, period = 'month' } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  let queryStart: Date;
  let queryEnd: Date;

  if (startDate && endDate) {
    queryStart = new Date(startDate as string);
    queryEnd = new Date(endDate as string);
    if (isNaN(queryStart.getTime()) || isNaN(queryEnd.getTime())) {
      throw BadRequestError('日期格式不正确');
    }
  } else {
    const now = new Date();
    if (period === 'week') {
      queryStart = new Date(now);
      queryStart.setDate(queryStart.getDate() - 7);
    } else if (period === 'month') {
      queryStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      queryStart = new Date(now.getFullYear(), 0, 1);
    } else {
      queryStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    queryEnd = now;
  }

  if (queryStart >= queryEnd) {
    throw BadRequestError('开始日期必须小于结束日期');
  }

  const params: any = {
    startDate: queryStart,
    endDate: queryEnd,
  };

  if (userRole === 'investor') {
    params.investorId = userId;
  } else if (userRole === 'student') {
    params.userId = userId;
  }

  const stats = await transactionService.getTransactionStatistics(params);

  const user = await userService.getUserById(userId);

  res.json({
    success: true,
    data: {
      period,
      dateRange: {
        startDate: queryStart,
        endDate: queryEnd,
      },
      statistics: stats,
      currentBalance: user.balance,
      averageDailySpending: stats.totalAmount > 0
        ? stats.totalAmount / Math.ceil((queryEnd.getTime() - queryStart.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    },
    message: '获取统计数据成功',
  });
});

export const refundTransaction = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { transactionId } = req.params;
  const { reason } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!transactionId) {
    throw BadRequestError('交易ID不能为空');
  }

  if (!reason) {
    throw BadRequestError('退款原因不能为空');
  }

  if (reason.length < 2 || reason.length > 500) {
    throw BadRequestError('退款原因长度必须在2-500个字符之间');
  }

  const transaction = await transactionService.getTransactionById(transactionId);
  if (!transaction) {
    throw NotFoundError('交易记录不存在');
  }

  if (userRole === 'student') {
    if (transaction.userId?.toString() !== userId) {
      throw ForbiddenError('无权操作该交易');
    }
    if (Date.now() - (transaction.createdAt?.getTime() || 0) > 24 * 60 * 60 * 1000) {
      throw BadRequestError('超过24小时的交易无法申请退款');
    }
  }

  const refundResult = await transactionService.refundTransaction(transactionId, reason);

  logger.info(`退款申请: transactionId=${transactionId}, userId=${userId}, reason=${reason}`);

  res.json({
    success: true,
    data: refundResult,
    message: '退款成功',
  });
});

export const getTransactionByNo = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { transactionNo } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!transactionNo) {
    throw BadRequestError('交易编号不能为空');
  }

  const transaction = await transactionService.getTransactionByNo(transactionNo);
  if (!transaction) {
    throw NotFoundError('交易记录不存在');
  }

  if (userRole === 'student') {
    if (transaction.userId?.toString() !== userId) {
      throw ForbiddenError('无权访问该交易记录');
    }
  }

  res.json({
    success: true,
    data: transaction,
    message: '获取交易详情成功',
  });
});

export const calculateTieredPrice = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { waterVolume } = req.query;

  if (!waterVolume) {
    throw BadRequestError('用水量不能为空');
  }

  const volume = parseFloat(waterVolume as string);
  if (isNaN(volume) || volume <= 0) {
    throw BadRequestError('用水量必须大于0');
  }

  const result = transactionService.calculateTieredAmount(volume);

  res.json({
    success: true,
    data: {
      waterVolume: volume,
      totalAmount: result.totalAmount,
      pricingDetails: result.pricingDetails,
      effectivePrice: result.totalAmount / volume,
    },
    message: '价格计算成功',
  });
});
