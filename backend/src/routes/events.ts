import { Router, Response } from 'express';
import { EventModel, ClusterModel } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/clusters/:clusterId/events', authMiddleware, (req: AuthRequest, res: Response) => {
  const { clusterId } = req.params;
  const cluster = ClusterModel.findById(clusterId);
  if (!cluster) {
    res.status(404).json({ code: 404, message: '集群不存在', data: null });
    return;
  }
  const events = EventModel.listByCluster(clusterId);
  res.json({ code: 200, message: 'success', data: events });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const event = EventModel.findById(req.params.id);
  if (!event) {
    res.status(404).json({ code: 404, message: '事件不存在', data: null });
    return;
  }
  res.json({ code: 200, message: 'success', data: event });
});

export default router;
