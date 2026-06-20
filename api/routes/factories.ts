import { Router, type Request, type Response } from 'express';
import repo from '../services/repository.js';

const router = Router();

// GET /api/factories - 获取工厂列表
router.get('/', (req: Request, res: Response) => {
  const { status, region } = req.query;
  const factories = repo.getFactories(status as any, region as string);
  res.json({ success: true, data: factories });
});

// GET /api/factories/:id - 获取工厂详情
router.get('/:id', (req: Request, res: Response) => {
  const factory = repo.getFactoryById(req.params.id);
  if (!factory) {
    return res.status(404).json({ success: false, error: '工厂不存在' });
  }
  res.json({ success: true, data: factory });
});

// POST /api/factories/:id/whitelist-status - 更新工厂白名单状态
router.post('/:id/whitelist-status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['whitelist', 'graylist', 'blacklist'].includes(status)) {
    return res.status(400).json({ success: false, error: '无效的白名单状态' });
  }
  const updated = repo.updateFactoryWhitelist(req.params.id, status as any);
  if (!updated) {
    return res.status(404).json({ success: false, error: '工厂不存在' });
  }
  res.json({ success: true, data: updated });
});

export default router;
