import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { success, error } from '../utils/response';
import {
  loginOrRegister,
  getUserProfile,
  updateUserProfile,
  getInviteStats,
} from '../services/userService';
import { checkin, getCheckinStatus } from '../services/checkinService';
import { uploadSteps, getTodaySteps, claimStepReward, getStepRecords } from '../services/stepService';
import { reportVideoWatch, getTodayVideoStats } from '../services/videoService';
import { analyzeBehavior } from '../services/riskService';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  try {
    const ip = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
    const deviceId = req.headers['x-device-id'] as string;
    const result = loginOrRegister({
      ...req.body,
      deviceId,
      ip,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
      },
    });
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/profile', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = getUserProfile((req as any).user.id);
    res.json(success(user));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.put('/profile', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = updateUserProfile((req as any).user.id, req.body);
    res.json(success(user));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/invite/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const stats = getInviteStats((req as any).user.id);
    res.json(success(stats));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/checkin', authMiddleware, (req: Request, res: Response) => {
  try {
    const deviceId = req.headers['x-device-id'] as string;
    const ip = (req.ip || '127.0.0.1') as string;
    analyzeBehavior((req as any).user.id, 'checkin', deviceId, ip);

    const result = checkin((req as any).user.id);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/checkin/status', authMiddleware, (req: Request, res: Response) => {
  try {
    const status = getCheckinStatus((req as any).user.id);
    res.json(success(status));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/steps', authMiddleware, (req: Request, res: Response) => {
  try {
    const { steps, source } = req.body;
    const result = uploadSteps((req as any).user.id, steps, source);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/steps/today', authMiddleware, (req: Request, res: Response) => {
  try {
    const result = getTodaySteps((req as any).user.id);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/steps/claim', authMiddleware, (req: Request, res: Response) => {
  try {
    const result = claimStepReward((req as any).user.id);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/steps/records', authMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 30;
    const result = getStepRecords((req as any).user.id, page, pageSize);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/video/watch', authMiddleware, (req: Request, res: Response) => {
  try {
    const { videoId, duration, watchDuration } = req.body;
    const deviceId = req.headers['x-device-id'] as string;
    const ip = (req.ip || '127.0.0.1') as string;
    analyzeBehavior((req as any).user.id, 'task:video', deviceId, ip);

    const result = reportVideoWatch((req as any).user.id, videoId, duration, watchDuration);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/video/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const result = getTodayVideoStats((req as any).user.id);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

export default router;
