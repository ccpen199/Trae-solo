import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { ok, fail } from '../utils/response';
import { PaymentChannel, PaymentStatus, FundTransactionType, FundAccountType } from '@platform/shared';
import { updateOrderStatus, createAlert } from '../services/order.service';
import { createAuditLog, AuditActions } from '../services/audit.service';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function getFeeConfig() {
  return {
    serviceFeeRate: 0.3,
    courierFeeRate: 0.5,
  };
}

async function processFundEntries(order: any, payment: any) {
  const accounts = await prisma.$transaction(async (tx) => {
    const regulatory = await tx.fundAccount.upsert({
      where: { accountNo: 'REG-ALL' },
      create: { accountNo: 'REG-ALL', accountType: FundAccountType.REGULATORY, balance: 0, frozenAmount: 0 },
      update: {},
    });
    const revenue = await tx.fundAccount.upsert({
      where: { accountNo: `REV-${order.applicantCity}` },
      create: { accountNo: `REV-${order.applicantCity}`, accountType: FundAccountType.SERVICE_REVENUE, managedCity: order.applicantCity, balance: 0, frozenAmount: 0 },
      update: {},
    });
    const gov = await tx.fundAccount.upsert({
      where: { accountNo: `GOV-${order.applicantCity}` },
      create: { accountNo: `GOV-${order.applicantCity}`, accountType: FundAccountType.GOVERNMENT_PAYABLE, managedCity: order.applicantCity, balance: 0, frozenAmount: 0 },
      update: {},
    });
    const courier = await tx.fundAccount.upsert({
      where: { accountNo: `CUR-${order.applicantCity}` },
      create: { accountNo: `CUR-${order.applicantCity}`, accountType: FundAccountType.COURIER_PAYABLE, managedCity: order.applicantCity, balance: 0, frozenAmount: 0 },
      update: {},
    });
    return { regulatory, revenue, gov, courier };
  });

  const totalAmt = parseFloat(order.totalAmount);
  const serviceAmt = parseFloat(order.serviceFee);
  const govAmt = parseFloat(order.governmentFee);
  const courierAmt = parseFloat(order.courierFee);

  await prisma.$transaction([
    prisma.fundAccount.update({ where: { id: accounts.regulatory.id }, data: { balance: { increment: totalAmt } } }),
    prisma.fundTransaction.create({
      data: {
        transNo: `TR${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`,
        accountId: accounts.regulatory.id,
        orderId: order.id,
        transType: FundTransactionType.SERVICE_FEE_COLLECT,
        amount: totalAmt,
        balanceAfter: parseFloat(accounts.regulatory.balance as any) + totalAmt,
        remark: `订单收款（监管账户）- ${order.orderNo}`,
        rawData: { paymentNo: payment.paymentNo, channel: payment.channel },
      },
    }),
  ]);
}

router.post('/:orderId/create', authMiddleware(), [
  param('orderId').notEmpty(),
  body('channel').isIn(Object.values(PaymentChannel)),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return fail(res, 404, '订单不存在');
  if (order.applicantId !== req.user!.userId) return fail(res, 403, '无权操作');
  if (order.paymentStatus !== PaymentStatus.UNPAID) return fail(res, 400, '订单支付状态异常');

  const paymentNo = `PAY${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;
  const payment = await prisma.paymentRecord.create({
    data: {
      orderId: order.id,
      paymentNo,
      amount: order.totalAmount,
      channel: req.body.channel,
      status: PaymentStatus.PENDING,
    },
  });

  await createAuditLog(req.user!, AuditActions.PAYMENT_INIT, 'Payment', { targetId: payment.id, traceId: req.traceId });

  setTimeout(async () => {
    try {
      const thirdPartyNo = `${req.body.channel}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, thirdPartyTradeNo: thirdPartyNo, paidAt: new Date() },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentChannel: req.body.channel,
          paidAt: new Date(),
          status: [
            'HK_MACAO_VISA', 'TAIWAN_VISA', 'ID_CARD_REPLACEMENT', 'VEHICLE_INSPECTION'
          ].includes(order.orderType as any) ? 'PENDING_PICKUP' as any : order.orderType,
        },
      });
      await processFundEntries(order, { ...payment, thirdPartyNo });
      await updateOrderStatus(order.id, 'PENDING_PICKUP' as any, req.user!.userId, '支付成功');
      await createAuditLog(req.user!, AuditActions.PAYMENT_SUCCESS, 'Payment', { targetId: payment.id });
    } catch (err: any) {
      console.error('Payment simulate failed:', err.message);
      await createAlert('PAYMENT_EXCEPTION' as any, 'DANGER' as any, order.applicantCity,
        '支付异常', `订单${order.orderNo}支付回调处理失败`, { orderId: order.id });
    }
  }, 1500);

  const payParams = {
    [PaymentChannel.WECHAT_PAY]: { appId: config.payment.wechat.appId, timeStamp: String(Math.floor(Date.now() / 1000)), nonceStr: uuidv4(), package: `prepay_id=${uuidv4()}`, signType: 'RSA' },
    [PaymentChannel.ALIPAY]: { orderStr: `alipay_sdk_mock_${paymentNo}_${order.totalAmount}` },
    [PaymentChannel.UNIONPAY]: { tn: `62${Date.now()}${Math.random().toString().slice(2, 18)}` },
  };

  return ok(res, {
    paymentId: payment.id,
    paymentNo,
    amount: order.totalAmount,
    channel: req.body.channel,
    payParams: (payParams as any)[req.body.channel],
    expireAt: new Date(Date.now() + 30 * 60 * 1000),
  }, '支付单已创建');
});

router.post('/:paymentNo/callback', async (req: Request, res: Response) => {
  const payment = await prisma.paymentRecord.findUnique({ where: { paymentNo: req.params.paymentNo } });
  if (!payment) return res.status(200).send('success');
  if (payment.status === PaymentStatus.PAID) return res.status(200).send('success');

  res.status(200).send('success');
});

router.get('/:orderId/status', authMiddleware(), async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return fail(res, 404, '订单不存在');
  if (order.applicantId !== req.user!.userId) return fail(res, 403, '无权操作');
  const payments = await prisma.paymentRecord.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } });
  return ok(res, {
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    paymentChannel: order.paymentChannel,
    paidAt: order.paidAt,
    totalAmount: order.totalAmount,
    payments: payments.map(p => ({
      id: p.id, paymentNo: p.paymentNo, amount: p.amount,
      channel: p.channel, status: p.status, paidAt: p.paidAt,
    })),
  });
});

router.post('/:orderId/refund', authMiddleware(), async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return fail(res, 404, '订单不存在');
  if (order.applicantId !== req.user!.userId && !['PROVINCE_ADMIN', 'CITY_OPERATOR'].includes(req.user!.role)) {
    return fail(res, 403, '无权操作');
  }
  if (order.paymentStatus !== PaymentStatus.PAID) return fail(res, 400, '订单未支付');
  const refundAmount = parseFloat(String(order.totalAmount));
  const latestPayment = await prisma.paymentRecord.findFirst({ where: { orderId: order.id, status: PaymentStatus.PAID } });
  if (!latestPayment) return fail(res, 400, '未找到支付记录');

  await prisma.paymentRecord.update({
    where: { id: latestPayment.id },
    data: { status: PaymentStatus.REFUNDING, refundAmount, refundedAt: new Date() },
  });

  setTimeout(async () => {
    await prisma.paymentRecord.update({ where: { id: latestPayment.id }, data: { status: PaymentStatus.REFUNDED } });
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: PaymentStatus.REFUNDED } });
  }, 2000);

  await createAuditLog(req.user!, AuditActions.PAYMENT_REFUND, 'Payment', { targetId: latestPayment.id, traceId: req.traceId });
  return ok(res, { refundNo: `REF${Date.now()}`, refundAmount }, '退款申请已提交');
});

export default router;
