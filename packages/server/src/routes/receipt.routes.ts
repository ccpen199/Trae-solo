import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { ok, fail } from '../utils/response';

const router = Router();

router.get('/order/:orderId', authMiddleware(), async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { electronicReceipt: true } });
  if (!order) return fail(res, 404, '订单不存在');
  if (req.user!.role === 'APPLICANT' && order.applicantId !== req.user!.userId) return fail(res, 403, '无权查看');
  if (!order.electronicReceipt) return fail(res, 404, '电子回执尚未生成');
  return ok(res, {
    receiptNo: order.electronicReceipt.receiptNo,
    receiptType: order.electronicReceipt.receiptType,
    receiptData: order.electronicReceipt.receiptData,
    verifyCode: order.electronicReceipt.verifyCode,
    issuedAt: order.electronicReceipt.issuedAt,
    qrCodeData: `https://verify.gd-gov.cn/r/${order.electronicReceipt.receiptNo}/${order.electronicReceipt.verifyCode}`,
  });
});

router.get('/verify/:receiptNo/:verifyCode', async (req: Request, res: Response) => {
  const receipt = await prisma.electronicReceipt.findUnique({
    where: { receiptNo: req.params.receiptNo },
    include: { order: { select: { orderNo: true, orderType: true, completedAt: true, totalAmount: true } } },
  });
  if (!receipt) return fail(res, 404, '回执不存在');
  if (receipt.verifyCode !== req.params.verifyCode) return fail(res, 400, '验证码不匹配');
  await prisma.electronicReceipt.update({ where: { id: receipt.id }, data: { verifiedCount: { increment: 1 } } });
  return ok(res, {
    valid: true,
    receiptNo: receipt.receiptNo,
    receiptType: receipt.receiptType,
    orderNo: receipt.order?.orderNo,
    orderType: receipt.order?.orderType,
    completedAt: receipt.order?.completedAt,
    totalAmount: receipt.order?.totalAmount,
    receiptData: receipt.receiptData,
    issuedAt: receipt.issuedAt,
    verifiedAt: new Date(),
  });
});

export default router;
