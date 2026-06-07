import { Router, Response } from 'express';
import {
  createDirectOrder,
  createOrderByScan,
  startOrder,
  pauseOrder,
  continueOrder,
  payOrder,
  getOrderById,
  getOrderEnergyData,
  getOrderStats,
  getUserOrders
} from '../services/orderService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();

router.get('/stats', authMiddleware, (req, res: Response) => {
  success(res, getOrderStats());
});

router.get('/settlement', authMiddleware, (req, res: Response) => {
  success(res, []);
});

router.get('/energy-split', authMiddleware, (req, res: Response) => {
  success(res, []);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const deviceId = parseInt(req.body.deviceId || req.body.device_id, 10);
  if (!deviceId) {
    error(res, '设备ID不能为空');
    return;
  }
  const result = createDirectOrder({
    userId: req.user!.userId,
    deviceId,
    program: req.body.program,
    duration: req.body.duration ? Number(req.body.duration) : undefined,
    amount: req.body.amount
  });
  if (result.error) {
    error(res, result.error);
    return;
  }
  success(res, result, '订单创建成功');
});

router.post('/scan', authMiddleware, (req: AuthRequest, res: Response) => {
  const { qrCode } = req.body;
  if (!qrCode) {
    error(res, '二维码不能为空');
    return;
  }

  const result = createOrderByScan({ userId: req.user!.userId, qrCode });
  if (result.error) {
    error(res, result.error);
    return;
  }
  success(res, result, '扫码成功');
});

router.post('/:id/start', authMiddleware, (req, res: Response) => {
  const orderId = parseInt(req.params.id, 10);
  const { programId } = req.body;
  if (!programId) {
    error(res, '洗衣程序ID不能为空');
    return;
  }

  const result = startOrder({ orderId, programId });
  if (result.error) {
    error(res, result.error);
    return;
  }
  success(res, result, '启动成功');
});

router.post('/:id/pause', authMiddleware, (req, res: Response) => {
  const orderId = parseInt(req.params.id, 10);
  const result = pauseOrder(orderId);
  if (result.error) {
    error(res, result.error);
    return;
  }
  success(res, result, '暂停成功');
});

router.post('/:id/continue', authMiddleware, (req, res: Response) => {
  const orderId = parseInt(req.params.id, 10);
  const result = continueOrder(orderId);
  if (result.error) {
    error(res, result.error);
    return;
  }
  success(res, result, '续洗成功');
});

router.post('/:id/pay', authMiddleware, (req, res: Response) => {
  const orderId = parseInt(req.params.id, 10);
  const { payMethod } = req.body;
  if (!payMethod) {
    error(res, '支付方式不能为空');
    return;
  }

  const result = payOrder({ orderId, payMethod });
  if (result.error) {
    error(res, result.error);
    return;
  }
  success(res, result, '支付成功');
});

router.get('/:id', authMiddleware, (req, res: Response) => {
  const orderId = parseInt(req.params.id, 10);
  const order = getOrderById(orderId);
  if (!order) {
    error(res, '订单不存在', 404);
    return;
  }
  success(res, order);
});

router.get('/:id/energy', authMiddleware, (req, res: Response) => {
  const orderId = parseInt(req.params.id, 10);
  const data = getOrderEnergyData(orderId);
  if (!data) {
    error(res, '订单不存在', 404);
    return;
  }
  success(res, data);
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const orders = getUserOrders(
    req.user!.userId,
    status as string | undefined
  );
  success(res, orders);
});

router.post('/:id/feedback', authMiddleware, (req, res: Response) => {
  success(res, { success: true }, '反馈已提交');
});

export default router;
