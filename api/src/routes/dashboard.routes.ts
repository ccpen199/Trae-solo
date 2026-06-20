import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/permission';
import { AppError } from '../middleware/error';
import { dashboardService } from '../services/dashboard.service';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }
    const data = dashboardService.getOverview(
      req.user.userId,
      req.user.role,
      req.user.outletId
    );
    res.json({
      code: 200,
      message: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/overview', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }
    const data = dashboardService.getOverview(
      req.user.userId,
      req.user.role,
      req.user.outletId
    );
    res.json({
      code: 200,
      message: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/global', authMiddleware, requireRole('operator'), (req: Request, res: Response, next) => {
  try {
    const data = dashboardService.getGlobalData();
    res.json({
      code: 200,
      message: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
});

export default router;

