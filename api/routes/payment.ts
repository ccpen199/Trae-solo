import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getStudentByUserId } from '../services/studentService.js';
import { createRecharge, processPayment, getRechargeRecords } from '../services/paymentService.js';
import { PaymentChannel } from '../../shared/types.js';

const router = Router();

router.post('/recharge', authMiddleware(['student']), (req, res): void => {
  const { amount, channel } = req.body as { amount: number; channel: PaymentChannel };

  if (!amount || amount <= 0) {
    res.status(400).json({ code: 400, message: '充值金额必须大于0', data: null });
    return;
  }
  if (!channel || !['alipay', 'wechat'].includes(channel)) {
    res.status(400).json({ code: 400, message: '无效的支付渠道', data: null });
    return;
  }

  const student = getStudentByUserId(req.auth!.userId);
  if (!student) {
    res.status(404).json({ code: 404, message: '学生档案不存在', data: null });
    return;
  }

  const record = createRecharge(student.id, amount, channel);
  res.json({ code: 200, message: '充值订单已创建', data: record });
});

router.post('/recharge/:id/pay', authMiddleware(['student']), (req, res): void => {
  const result = processPayment(req.params.id);
  if (!result) {
    res.status(400).json({ code: 400, message: '支付失败，订单状态异常', data: null });
    return;
  }
  res.json({ code: 200, message: '支付成功', data: result });
});

router.get('/records', authMiddleware(['student']), (req, res): void => {
  const student = getStudentByUserId(req.auth!.userId);
  if (!student) {
    res.status(404).json({ code: 404, message: '学生档案不存在', data: null });
    return;
  }
  const records = getRechargeRecords(student.id);
  res.json({ code: 200, message: 'success', data: records });
});

export default router;
