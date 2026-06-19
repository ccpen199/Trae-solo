import { Router, Request, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/auth';
import { success, error } from '../utils/response';
import {
  adminLogin,
  getAdminProfile,
  blockUser,
  markCheater,
} from '../services/adminService';
import {
  getAdminTaskList,
  createTask,
  updateTask,
} from '../services/taskService';
import {
  getAdminWithdrawalList,
  auditWithdrawal,
} from '../services/withdrawalService';
import {
  getDashboardStats,
  getTaskROIList,
  getTaskROI,
  getRetentionStats,
  getDailyStats,
  getUserLtvPrediction,
  getUserList,
} from '../services/analyticsService';
import {
  getRiskEvents,
  getRiskStats,
} from '../services/riskService';
import {
  getAdminAdList,
  createAdConfig,
  updateAdConfig,
  deleteAdConfig,
  getAdStats,
} from '../services/adService';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = adminLogin(username, password);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/profile', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const admin = getAdminProfile((req as any).admin.id);
    res.json(success(admin));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/dashboard', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const stats = getDashboardStats();
    res.json(success(stats));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/daily-stats', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = getDailyStats(days);
    res.json(success(stats));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/retention', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const stats = getRetentionStats();
    res.json(success(stats));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/tasks', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getAdminTaskList(page, pageSize);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/tasks', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const task = createTask(req.body);
    res.json(success(task));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.put('/tasks/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const task = updateTask(id, req.body);
    res.json(success(task));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/task-roi', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getTaskROIList(page, pageSize);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/task-roi/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const roi = getTaskROI(id);
    res.json(success(roi));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/withdrawals', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getAdminWithdrawalList(status as string, page, pageSize);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/withdrawals/:id/audit', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reason } = req.body;
    const result = auditWithdrawal(id, status, reason, (req as any).admin.username);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/users', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getUserList(page, pageSize, keyword as string);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/users/:id/ltv', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const ltv = getUserLtvPrediction(id);
    res.json(success({ ltv }));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/users/:id/block', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { blocked } = req.body;
    const result = blockUser(id, blocked);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/users/:id/cheater', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { isCheater } = req.body;
    const result = markCheater(id, isCheater);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/risk/events', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const { eventType } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getRiskEvents(page, pageSize, eventType as string);
    res.json(success(result));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/risk/stats', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const stats = getRiskStats();
    res.json(success(stats));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/ads', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const ads = getAdminAdList();
    res.json(success(ads));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.post('/ads', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const ad = createAdConfig(req.body);
    res.json(success(ad));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.put('/ads/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const ad = updateAdConfig(id, req.body);
    res.json(success(ad));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.delete('/ads/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    deleteAdConfig(id);
    res.json(success());
  } catch (e: any) {
    res.json(error(e.message));
  }
});

router.get('/ad-stats', adminAuthMiddleware, (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = getAdStats(days);
    res.json(success(stats));
  } catch (e: any) {
    res.json(error(e.message));
  }
});

export default router;
