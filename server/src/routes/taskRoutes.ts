import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { success, error } from '../utils/response';
import {
  getTaskList,
  completeTask,
  claimTaskReward,
} from '../services/taskService';
import { analyzeBehavior } from '../services/riskService';

const router = Router();

router.get('/list', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tasks = getTaskList(user.id, user.region);
    res.json(success(tasks));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/:taskId/complete', authMiddleware, (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const deviceId = req.headers['x-device-id'] as string;
    const ip = (req.ip || '127.0.0.1') as string;
    analyzeBehavior((req as any).user.id, `task:${taskId}`, deviceId, ip);

    const result = completeTask((req as any).user.id, taskId, req.body);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/:taskId/claim', authMiddleware, (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const result = claimTaskReward((req as any).user.id, taskId);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

export default router;
