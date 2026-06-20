import { Router, type Request, type Response } from 'express';
import repo from '../services/repository.js';

const router = Router();

// GET /api/workers - 获取工人列表
router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: repo.getWorkers() });
});

// GET /api/workers/credit-distribution - 信用分分布统计
router.get('/credit-distribution', (_req: Request, res: Response) => {
  const data = repo.getCreditDistribution();
  res.json({ success: true, data });
});

// GET /api/workers/:id - 获取工人详情
router.get('/:id', (req: Request, res: Response) => {
  const worker = repo.getWorkerById(req.params.id);
  if (!worker) {
    return res.status(404).json({ success: false, error: '工人不存在' });
  }
  res.json({ success: true, data: worker });
});

// POST /api/workers/:id/verify-idcard - 模拟身份证OCR核验
router.post('/:id/verify-idcard', (req: Request, res: Response) => {
  const mockData = req.body || {
    name: '演示用户',
    idNumber: '3205021990******00',
    address: '演示地址',
  };
  const updated = repo.verifyWorkerIdCard(req.params.id, mockData);
  if (!updated) {
    return res.status(404).json({ success: false, error: '工人不存在' });
  }
  res.json({ success: true, data: updated, message: '身份证OCR核验通过' });
});

// PATCH /api/workers/:id/credit-score - 调整工人信用分
router.patch('/:id/credit-score', (req: Request, res: Response) => {
  const { score, reason } = req.body;
  if (typeof score !== 'number') {
    return res.status(400).json({ success: false, error: '请提供有效的信用分数值' });
  }
  const updated = repo.updateWorkerCreditScore(req.params.id, score, reason);
  if (!updated) {
    return res.status(404).json({ success: false, error: '工人不存在' });
  }
  res.json({ success: true, data: updated });
});

export default router;
