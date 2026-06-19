import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '@middleware/errorHandler';
import { PaymentService } from '@services/paymentService';
import { UserService } from '@services/userService';
import { config } from '@config/index';
import { logger } from '@utils/logger';

const paymentService = PaymentService.getInstance();
const userService = UserService.getInstance();

export const createAlipayH5Payment = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { amount, subject, body, returnUrl, notifyUrl } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!amount) {
    throw BadRequestError('支付金额不能为空');
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw BadRequestError('支付金额必须大于0');
  }

  if (amountNum < config.business.minRechargeAmount) {
    throw BadRequestError(`最小充值金额为${config.business.minRechargeAmount}元`);
  }

  if (amountNum > config.business.maxRechargeAmount) {
    throw BadRequestError(`最大充值金额为${config.business.maxRechargeAmount}元`);
  }

  if (!subject) {
    throw BadRequestError('订单标题不能为空');
  }

  if (subject.length > 256) {
    throw BadRequestError('订单标题长度不能超过256个字符');
  }

  if (body && body.length > 500) {
    throw BadRequestError('订单描述长度不能超过500个字符');
  }

  const rechargeAmounts = [10, 20, 50, 100, 200, 500];
  if (!rechargeAmounts.includes(Math.round(amountNum * 100) / 100) && amountNum !== config.business.minRechargeAmount && amountNum !== config.business.maxRechargeAmount) {
    const user = await userService.getUserById(userId);
    if (user.role !== 'admin') {
      throw BadRequestError(`请选择标准充值金额: ${rechargeAmounts.join('、')}元`);
    }
  }

  const result = await paymentService.createAlipayH5Order({
    userId,
    amount: amountNum,
    subject,
    body,
    returnUrl,
    notifyUrl,
  });

  logger.info(`创建支付宝H5支付订单: userId=${userId}, transactionNo=${result.order.transactionNo}, amount=${amountNum}`);

  res.json({
    success: true,
    data: {
      orderId: result.order._id,
      transactionNo: result.order.transactionNo,
      amount: result.order.amount,
      subject: result.order.subject,
      payUrl: result.payUrl,
      status: result.order.status,
      paymentMethod: 'alipay_h5',
      createdAt: result.order.createdAt,
      expireAt: new Date(Date.now() + 30 * 60 * 1000),
    },
    message: '支付订单创建成功',
  });
});

export const handleAlipayNotify = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const notifyParams = req.body;

  logger.info(`收到支付宝回调: ${JSON.stringify(notifyParams)}`);

  if (!notifyParams || !notifyParams.out_trade_no || !notifyParams.trade_status) {
    logger.error('支付宝回调参数不完整');
    res.status(400).send('fail');
    return;
  }

  const result = await paymentService.handleAlipayNotify(notifyParams);

  if (result) {
    logger.info(`支付宝回调处理成功: out_trade_no=${notifyParams.out_trade_no}, trade_status=${notifyParams.trade_status}`);
    res.status(200).send('success');
  } else {
    logger.error(`支付宝回调处理失败: out_trade_no=${notifyParams.out_trade_no}`);
    res.status(400).send('fail');
  }
});

export const queryPaymentStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const { transactionId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!transactionId) {
    throw BadRequestError('交易ID不能为空');
  }

  const result = await paymentService.queryPaymentStatus(transactionId);

  if (!result.transaction) {
    throw NotFoundError('交易不存在');
  }

  if (result.transaction.userId?.toString() !== userId && req.userRole !== 'admin') {
    throw ForbiddenError('无权查询该交易');
  }

  res.json({
    success: true,
    data: {
      transactionId: result.transaction._id,
      transactionNo: result.transaction.transactionNo,
      status: result.status,
      amount: result.transaction.amount,
      subject: result.transaction.subject,
      type: result.transaction.type,
      paymentMethod: result.transaction.paymentMethod,
      payTime: result.transaction.payTime,
      thirdPartyTradeNo: result.transaction.thirdPartyTradeNo,
      createdAt: result.transaction.createdAt,
      balanceBefore: result.transaction.balanceBefore,
      balanceAfter: result.transaction.balanceAfter,
      failedReason: result.transaction.failedReason,
    },
    message: '支付状态查询成功',
  });
});

export const getPaymentOrderList = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const {
    page = 1,
    pageSize = 20,
    status,
    startDate,
    endDate,
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

  const params: any = {
    userId,
    status: status as string,
    page: pageNum,
    pageSize: sizeNum,
  };

  if (startDate) {
    const start = new Date(startDate as string);
    if (isNaN(start.getTime())) {
      throw BadRequestError('开始日期格式不正确');
    }
    params.startDate = start;
  }

  if (endDate) {
    const end = new Date(endDate as string);
    if (isNaN(end.getTime())) {
      throw BadRequestError('结束日期格式不正确');
    }
    params.endDate = end;
  }

  const { orders, total } = await paymentService.getPaymentOrders(params);

  const successOrders = orders.filter(o => o.status === 'success');
  const totalPaidAmount = successOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalRefundAmount = orders.filter(o => o.type === 'refund' && o.status === 'success').reduce((sum, o) => sum + o.amount, 0);

  res.json({
    success: true,
    data: {
      orders,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
      summary: {
        totalPaidAmount,
        totalRefundAmount,
        netAmount: totalPaidAmount - totalRefundAmount,
        orderCount: total,
        successCount: successOrders.length,
      },
    },
    message: '获取支付订单列表成功',
  });
});

export const getRechargeOptions = asyncHandler(async (_req: AuthRequest, res: Response, _next: NextFunction) => {
  const standardAmounts = [10, 20, 50, 100, 200, 500];
  const bonuses: Record<number, number> = {
    10: 0,
    20: 1,
    50: 5,
    100: 12,
    200: 30,
    500: 88,
  };

  const options = standardAmounts.map(amount => ({
    amount,
    bonus: bonuses[amount] || 0,
    actualAmount: amount + (bonuses[amount] || 0),
    description: bonuses[amount] > 0 ? `充${amount}送${bonuses[amount]}元` : '标准充值',
    isHot: amount === 100,
    isBest: amount === 500,
  }));

  res.json({
    success: true,
    data: {
      options,
      minAmount: config.business.minRechargeAmount,
      maxAmount: config.business.maxRechargeAmount,
      paymentMethods: [
        {
          id: 'alipay_h5',
          name: '支付宝',
          icon: 'alipay',
          enabled: true,
          description: '推荐使用，安全便捷',
        },
        {
          id: 'wechat_h5',
          name: '微信支付',
          icon: 'wechat',
          enabled: false,
          description: '即将开通',
        },
      ],
    },
    message: '获取充值选项成功',
  });
});

export const createRefund = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { transactionId, refundAmount, refundReason } = req.body;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!transactionId) {
    throw BadRequestError('交易ID不能为空');
  }

  if (!refundAmount) {
    throw BadRequestError('退款金额不能为空');
  }

  const refundAmountNum = parseFloat(refundAmount);
  if (isNaN(refundAmountNum) || refundAmountNum <= 0) {
    throw BadRequestError('退款金额必须大于0');
  }

  if (!refundReason) {
    throw BadRequestError('退款原因不能为空');
  }

  if (userRole !== 'admin') {
    throw ForbiddenError('只有管理员可以发起退款');
  }

  const result = await paymentService.alipayRefund({
    transactionId,
    refundAmount: refundAmountNum,
    refundReason,
  });

  logger.info(`退款成功: transactionId=${transactionId}, refundAmount=${refundAmountNum}, operator=${userId}`);

  res.json({
    success: true,
    data: {
      refundTransactionId: result._id,
      refundTransactionNo: result.transactionNo,
      originalTransactionId: transactionId,
      refundAmount: result.amount,
      refundReason,
      status: result.status,
      refundTime: result.refundTime,
    },
    message: '退款成功',
  });
});

export const handleAlipayReturn = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { out_trade_no, trade_status, total_amount } = req.query;

  logger.info(`支付宝同步返回: out_trade_no=${out_trade_no}, trade_status=${trade_status}`);

  if (!out_trade_no) {
    throw BadRequestError('交易编号不能为空');
  }

  const { transaction } = await paymentService.queryPaymentStatus(out_trade_no as string);

  const redirectUrl = config.alipay.returnUrl || '/pages/payment/result';
  const redirectParams = new URLSearchParams({
    transactionNo: out_trade_no as string,
    status: transaction?.status || trade_status || 'unknown',
    amount: (transaction?.amount || total_amount || '0').toString(),
  });

  res.redirect(`${redirectUrl}?${redirectParams.toString()}`);
});
