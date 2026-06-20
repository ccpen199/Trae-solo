import { Router, type Request, type Response } from 'express';
import repo from '../services/repository.js';

const router = Router();

// GET /api/jobs - 获取岗位列表
router.get('/', (req: Request, res: Response) => {
  const { factoryId, status } = req.query;
  const jobs = repo.getJobs({ factoryId: factoryId as string, status: status as any });
  res.json({ success: true, data: jobs });
});

// GET /api/jobs/match - 定位匹配周边岗位
router.get('/match', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string) || 31.3;
  const lng = parseFloat(req.query.lng as string) || 120.6;
  const radius = parseInt(req.query.radius as string) || 50;
  const matches = repo.matchJobsByLocation(lat, lng, radius);
  res.json({ success: true, data: matches });
});

// GET /api/jobs/:id - 获取岗位详情
router.get('/:id', (req: Request, res: Response) => {
  const job = repo.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: '岗位不存在' });
  }
  const factory = repo.getFactoryById(job.factoryId);
  res.json({ success: true, data: { job, factory } });
});

// POST /api/jobs - 发布新岗位
router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ success: true, message: '岗位创建成功（演示接口）', data: req.body });
});

export default router;
