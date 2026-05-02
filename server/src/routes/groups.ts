import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authMiddleware, roleMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { inventoryEngine } from '../engines/inventory.engine';
import { TourGroupStatus } from '../types/constants';
import prisma from '../lib/prisma';

const router = Router();

router.get(
  '/public',
  optionalAuthMiddleware,
  [
    query('tourId').optional().isString(),
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

      const { tourId, status } = req.query;

      const where: any = {
        isArchived: false,
        status: status || TourGroupStatus.PUBLISHED,
        startDate: { gte: new Date() },
      };

      if (tourId) {
        where.tourId = tourId;
      }

      const groups = await prisma.tourGroup.findMany({
        where,
        include: {
          tour: {
            select: {
              id: true,
              name: true,
              destination: true,
              days: true,
              nights: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      });

      res.json({
        success: true,
        data: {
          data: groups,
          total: groups.length,
          page: 1,
          pageSize: groups.length,
          totalPages: 1,
        },
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
    query('tourId').optional().isString(),
    query('status').optional().isIn(Object.values(TourGroupStatus)),
    query('startDateFrom').optional().isISO8601(),
    query('startDateTo').optional().isISO8601(),
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

      const { page = 1, pageSize = 20, tourId, status, startDateFrom, startDateTo } = req.query;

      const where: any = { isArchived: false };

      if (tourId) {
        where.tourId = tourId;
      }

      if (status) {
        where.status = status;
      }

      if (startDateFrom || startDateTo) {
        where.startDate = {};
        if (startDateFrom) {
          where.startDate.gte = new Date(startDateFrom as string);
        }
        if (startDateTo) {
          where.startDate.lte = new Date(startDateTo as string);
        }
      }

      const skip = (Number(page) - 1) * Number(pageSize);

      const [groups, total] = await Promise.all([
        prisma.tourGroup.findMany({
          where,
          include: {
            tour: true,
            guide: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            sales: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            _count: {
              select: { orders: true },
            },
          },
          orderBy: { startDate: 'asc' },
          skip,
          take: Number(pageSize),
        }),
        prisma.tourGroup.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          data: groups,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
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

      const group = await prisma.tourGroup.findUnique({
        where: { id: req.params.id },
        include: {
          tour: true,
          guide: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          sales: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          itineraryDays: {
            orderBy: { dayNumber: 'asc' },
          },
          orders: {
            where: { isArchived: false },
            include: {
              tourists: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: '团期不存在',
          error: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: group,
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
    body('tourId').isString().notEmpty().withMessage('线路ID不能为空'),
    body('startDate').isISO8601().withMessage('出发日期格式不正确'),
    body('endDate').isISO8601().withMessage('结束日期格式不正确'),
    body('price').isFloat({ min: 0 }).withMessage('成人价格必须大于等于0'),
    body('childPrice').optional().isFloat({ min: 0 }),
    body('totalStock').isInt({ min: 1 }).withMessage('总库存必须大于0'),
    body('minGroupSize').optional().isInt({ min: 1 }),
    body('maxGroupSize').optional().isInt({ min: 1 }),
    body('departurePoint').optional().isString(),
    body('returnPoint').optional().isString(),
    body('meetingTime').optional().isString(),
    body('notes').optional().isString(),
    body('itinerary').optional().isArray(),
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
      const { startDate, endDate, ...rest } = req.body;

      const result = await inventoryEngine.createGroup(user, {
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '团期创建成功',
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
      const result = await inventoryEngine.publishGroup(user, req.params.id);

      res.json({
        success: true,
        data: result,
        message: '团期发布成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/inventory',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'GUIDE', 'AGENCY'),
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

      const result = await inventoryEngine.getGroupInventoryStats(req.params.id);

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

router.put(
  '/:id/assign-guide',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('团期ID不能为空'),
    body('guideId').isString().notEmpty().withMessage('导游ID不能为空'),
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

      const { guideId } = req.body;

      const guide = await prisma.user.findUnique({
        where: { id: guideId },
      });

      if (!guide || guide.role !== 'GUIDE') {
        return res.status(400).json({
          success: false,
          message: '导游不存在或角色不正确',
          error: 'INVALID_GUIDE',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const group = await prisma.tourGroup.update({
        where: { id: req.params.id },
        data: { guideId },
      });

      res.json({
        success: true,
        data: group,
        message: '导游分配成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
