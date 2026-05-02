import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { guideService } from '../services/guide.service';
import { TourGroupStatus } from '../types/constants';

const router = Router();

router.get(
  '/tasks',
  authMiddleware,
  roleMiddleware('GUIDE'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(Object.values(TourGroupStatus)),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          error: 'VALIDATION_ERROR',
          data: { errors: errors.array() },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const user = (req as AuthenticatedRequest).user;
      const { page = 1, pageSize = 20, status } = req.query;

      const result = await guideService.getGuideTasks(user.userId, {
        page: Number(page),
        pageSize: Number(pageSize),
        status: status as TourGroupStatus,
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/tasks/:id',
  authMiddleware,
  roleMiddleware('GUIDE'),
  [
    param('id').isString().notEmpty().withMessage('团期ID不能为空'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          error: 'VALIDATION_ERROR',
          data: { errors: errors.array() },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const user = (req as AuthenticatedRequest).user;
      const result = await guideService.getTaskDetail(user.userId, req.params.id);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/tasks/:id/start',
  authMiddleware,
  roleMiddleware('GUIDE'),
  [
    param('id').isString().notEmpty().withMessage('团期ID不能为空'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          error: 'VALIDATION_ERROR',
          data: { errors: errors.array() },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const user = (req as AuthenticatedRequest).user;
      const result = await guideService.startTour(user.userId, req.params.id);

      res.json({
        success: true,
        data: result,
        message: '行程已开始',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/tasks/:id/complete',
  authMiddleware,
  roleMiddleware('GUIDE'),
  [
    param('id').isString().notEmpty().withMessage('团期ID不能为空'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          error: 'VALIDATION_ERROR',
          data: { errors: errors.array() },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const user = (req as AuthenticatedRequest).user;
      const result = await guideService.completeTour(user.userId, req.params.id);

      res.json({
        success: true,
        data: result,
        message: '行程已完成',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/tasks/:id/tourists',
  authMiddleware,
  roleMiddleware('GUIDE'),
  [
    param('id').isString().notEmpty().withMessage('团期ID不能为空'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          error: 'VALIDATION_ERROR',
          data: { errors: errors.array() },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const result = await guideService.getTouristsList(req.params.id);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/tasks/:id/reports',
  authMiddleware,
  [
    param('id').isString().notEmpty().withMessage('团期ID不能为空'),
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          error: 'VALIDATION_ERROR',
          data: { errors: errors.array() },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const { page = 1, pageSize = 20 } = req.query;
      const result = await guideService.getGroupReports(req.params.id, Number(page), Number(pageSize));

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/reports',
  authMiddleware,
  roleMiddleware('GUIDE', 'SALES', 'ADMIN'),
  [
    body('groupId').isString().notEmpty().withMessage('团期ID不能为空'),
    body('dayNumber').isInt({ min: 1 }).withMessage('天数必须大于0'),
    body('title').isString().isLength({ min: 1, max: 200 }).withMessage('标题必填'),
    body('content').isString().isLength({ min: 1 }).withMessage('内容必填'),
    body('weather').optional().isString(),
    body('issues').optional().isString(),
    body('touristStatus').optional().isString(),
    body('attachments').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          error: 'VALIDATION_ERROR',
          data: { errors: errors.array() },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const user = (req as AuthenticatedRequest).user;
      const result = await guideService.createTripReport(user, req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: '报告创建成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
