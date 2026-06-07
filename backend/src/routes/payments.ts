import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { payOrder } from '../services/orderService';
import { success, error } from '../utils/response';

const router = Router();

router.use(authMiddleware);

router.get('/methods', (_req, res: Response) => {
  success(res, [
    { code: 'wechat', name: '微信支付', enabled: true },
    { code: 'alipay', name: '支付宝', enabled: true },
    { code: 'balance', name: '余额支付', enabled: true },
    { code: 'card', name: '银行卡', enabled: true }
  ]);
});

router.post('/', (req, res: Response) => {
  const orderId = Number(req.body.orderId || req.body.order_id);
  const payMethod = req.body.paymentMethod || req.body.payMethod || req.body.method;
  if (!orderId || !payMethod) {
    error(res, '订单ID和支付方式不能为空');
    return;
  }

  const result = payOrder({ orderId, payMethod });
  if (result.error) {
    error(res, result.error);
    return;
  }

  success(res, result, '支付成功');
});

router.get('/:id/status', (req, res: Response) => {
  success(res, {
    id: Number(req.params.id),
    status: 'success'
  });
});

export default router;
