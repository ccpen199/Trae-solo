import { Router, Request, Response } from 'express';
import { asyncHandler, BadRequestError, NotFoundError } from '@middleware/errorHandler';
import { AuthRequest, authMiddleware, studentOnly } from '@middleware/auth';
import { paymentService } from '@services/paymentService';
import { logger } from '@utils/logger';

const router = Router();

router.post('/alipay/notify', asyncHandler(async (req: Request, res: Response) => {
  const notifyData = req.body;

  logger.info('收到支付宝回调通知:', JSON.stringify(notifyData));

  const result = await paymentService.handleAlipayNotify(notifyData);

  if (result) {
    res.status(200).send('success');
  } else {
    res.status(400).send('fail');
  }
}));

router.post('/alipay/return', asyncHandler(async (req: Request, res: Response) => {
  const returnData = req.query;

  logger.info('收到支付宝同步返回:', JSON.stringify(returnData));

  res.json({
    success: true,
    message: '支付返回处理成功',
    data: returnData,
  });
}));

router.use(authMiddleware);

router.post('/alipay/create', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, subject, body, returnUrl, notifyUrl } = req.body;

  if (!amount || amount <= 0) {
    throw BadRequestError('请提供有效的支付金额');
  }

  if (!subject) {
    throw BadRequestError('请提供订单标题');
  }

  const result = await paymentService.createAlipayH5Order({
    userId: req.userId!,
    amount: parseFloat(amount),
    subject,
    body,
    returnUrl,
    notifyUrl,
  });

  res.json({
    success: true,
    message: '支付订单创建成功',
    data: {
      orderNo: result.order.transactionNo,
      payUrl: result.payUrl,
      amount: result.order.amount,
      status: result.order.status,
    },
  });
}));

router.get('/order/:orderNo/status', studentOnly, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderNo } = req.params;

  if (!orderNo) {
    throw BadRequestError('订单号不能为空');
  }

  try {
    const transaction = await paymentService.getPaymentOrder(orderNo);

    if (transaction.userId?.toString() !== req.userId && req.userRole !== 'admin') {
      throw BadRequestError('无权访问该订单');
    }

    res.json({
      success: true,
      data: {
        orderNo: transaction.transactionNo,
        status: transaction.status,
        amount: transaction.amount,
        completedAt: transaction.completedAt,
      },
    });
  } catch (error) {
    throw NotFoundError('订单不存在');
  }
}));

export default router;
