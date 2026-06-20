import { Router, type Request, type Response } from 'express';
import repo from '../services/repository.js';

const router = Router();

// GET /api/brokers - 获取经纪人列表
router.get('/', (req: Request, res: Response) => {
  const { region } = req.query;
  res.json({ success: true, data: repo.getBrokers(region as string) });
});

// GET /api/brokers/:id - 获取经纪人详情
router.get('/:id', (req: Request, res: Response) => {
  const broker = repo.getBrokerById(req.params.id);
  if (!broker) {
    return res.status(404).json({ success: false, error: '经纪人不存在' });
  }
  res.json({ success: true, data: broker });
});

// GET /api/brokers/:id/orders - 获取经纪人订单
router.get('/:id/orders', (req: Request, res: Response) => {
  const orders = repo.getBrokerOrders(req.params.id);
  res.json({ success: true, data: orders });
});

export default router;
