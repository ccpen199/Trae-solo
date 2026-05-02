import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authMiddleware, roleMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { tourService } from '../services/tour.service';
import { TourStatus } from '../types/constants';

const router = Router();

router.get(
  '/public',
  optionalAuthMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('destination').optional().isString(),
    query('category').optional().isString(),
    query('keyword').optional().isString(),
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

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
        destination: req.query.destination as string,
        category: req.query.category as string,
        keyword: req.query.keyword as string,
      };

      const result = await tourService.getPublicTourList(params);

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
  '/public/:id',
  optionalAuthMiddleware,
  [
    param('id').isString().notEmpty().withMessage('线路ID不能为空'),
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

      const result = await tourService.getTour(req.params.id, true);

      if (result.status !== TourStatus.PUBLISHED) {
        return res.status(404).json({
          success: false,
          message: '线路不存在',
          error: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

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
  '/',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'GUIDE', 'AGENCY'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(Object.values(TourStatus)),
    query('destination').optional().isString(),
    query('category').optional().isString(),
    query('keyword').optional().isString(),
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

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
        status: req.query.status as TourStatus,
        destination: req.query.destination as string,
        category: req.query.category as string,
        keyword: req.query.keyword as string,
      };

      const result = await tourService.getTourList(params);

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
  '/:id',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'GUIDE', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('线路ID不能为空'),
    query('includeGroups').optional().isBoolean(),
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

      const includeGroups = req.query.includeGroups === 'true';
      const result = await tourService.getTour(req.params.id, includeGroups);

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
  '/',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    body('name').isString().isLength({ min: 1, max: 200 }).withMessage('线路名称必填'),
    body('destination').isString().isLength({ min: 1, max: 100 }).withMessage('目的地必填'),
    body('days').isInt({ min: 1, max: 365 }).withMessage('行程天数必须大于0'),
    body('nights').isInt({ min: 0, max: 365 }).withMessage('住宿晚数必须大于等于0'),
    body('basePrice').isFloat({ min: 0 }).withMessage('成人价格必须大于等于0'),
    body('childPrice').isFloat({ min: 0 }).withMessage('儿童价格必须大于等于0'),
    body('description').optional().isString(),
    body('routeDetails').optional().isString(),
    body('includeItems').optional().isString(),
    body('excludeItems').optional().isString(),
    body('notes').optional().isString(),
    body('category').optional().isString(),
    body('image').optional().isString(),
    body('minGroupSize').optional().isInt({ min: 1 }),
    body('maxGroupSize').optional().isInt({ min: 1 }),
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
      const result = await tourService.createTour(user, req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: '线路创建成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('线路ID不能为空'),
    body('name').optional().isString().isLength({ min: 1, max: 200 }),
    body('destination').optional().isString().isLength({ min: 1, max: 100 }),
    body('days').optional().isInt({ min: 1, max: 365 }),
    body('nights').optional().isInt({ min: 0, max: 365 }),
    body('basePrice').optional().isFloat({ min: 0 }),
    body('childPrice').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(Object.values(TourStatus)),
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
      const result = await tourService.updateTour(user, req.params.id, req.body);

      res.json({
        success: true,
        data: result,
        message: '线路更新成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/publish',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('线路ID不能为空'),
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
      const result = await tourService.publishTour(user, req.params.id);

      res.json({
        success: true,
        data: result,
        message: '线路发布成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/archive',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('线路ID不能为空'),
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
      const result = await tourService.archiveTour(user, req.params.id);

      res.json({
        success: true,
        data: result,
        message: '线路归档成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/stats',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('线路ID不能为空'),
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

      const result = await tourService.getTourStats(req.params.id);

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

export default router;
