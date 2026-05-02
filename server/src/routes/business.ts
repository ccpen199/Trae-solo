import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { touristEngine } from '../engines/tourist.engine';
import { settlementEngine } from '../engines/settlement.engine';
import prisma from '../lib/prisma';

const router = Router();

router.get(
  '/tourists/profile',
  authMiddleware,
  roleMiddleware('TOURIST'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const result = await touristEngine.getTouristProfile(user.userId);

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
  '/tourists/history',
  authMiddleware,
  roleMiddleware('TOURIST'),
  [
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

      const user = (req as AuthenticatedRequest).user;
      const { page = 1, pageSize = 20 } = req.query;

      const result = await touristEngine.getTouristTravelHistory(user.userId, Number(page), Number(pageSize));

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
  '/orders/:id/contract',
  authMiddleware,
  [
    param('id').isString().notEmpty().withMessage('订单ID不能为空'),
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

      const contracts = await prisma.contract.findMany({
        where: { orderId: req.params.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: contracts,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/orders/:id/contract',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN'),
  [
    param('id').isString().notEmpty().withMessage('订单ID不能为空'),
    body('version').optional().isString(),
    body('content').optional().isString(),
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
      const result = await touristEngine.generateContract(user, {
        orderId: req.params.id,
        version: req.body.version,
        content: req.body.content,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '合同生成成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/orders/:id/notice',
  authMiddleware,
  [
    param('id').isString().notEmpty().withMessage('订单ID不能为空'),
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

      const result = await touristEngine.generateTravelNotice(req.params.id);

      res.json({
        success: true,
        data: { content: result },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/orders/:id/insurance-list',
  authMiddleware,
  [
    param('id').isString().notEmpty().withMessage('订单ID不能为空'),
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

      const result = await touristEngine.generateInsuranceList(req.params.id);

      res.json({
        success: true,
        data: { content: result },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/settlements',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
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

      const { page = 1, pageSize = 20, status } = req.query;

      const where: any = { isArchived: false };

      if (status) {
        where.status = status;
      }

      const skip = (Number(page) - 1) * Number(pageSize);

      const [settlements, total] = await Promise.all([
        prisma.settlement.findMany({
          where,
          include: {
            group: {
              include: {
                tour: true,
              },
            },
            costItems: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(pageSize),
        }),
        prisma.settlement.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          data: settlements,
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
  '/settlements/:id',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('结算单ID不能为空'),
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

      const settlement = await prisma.settlement.findUnique({
        where: { id: req.params.id },
        include: {
          group: {
            include: {
              tour: true,
            },
          },
          costItems: true,
        },
      });

      if (!settlement) {
        return res.status(404).json({
          success: false,
          message: '结算单不存在',
          error: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: settlement,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/settlements/group/:groupId',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('groupId').isString().notEmpty().withMessage('团期ID不能为空'),
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
      const result = await settlementEngine.createSettlement(user, req.params.groupId);

      res.status(201).json({
        success: true,
        data: result,
        message: '结算单创建成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/settlements/group/:groupId/calculate',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('groupId').isString().notEmpty().withMessage('团期ID不能为空'),
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

      const result = await settlementEngine.calculateSettlement(req.params.groupId);

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
  '/settlements/:id/costs',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('结算单ID不能为空'),
    body('costItems').isArray().withMessage('成本项必须是数组'),
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
      const result = await settlementEngine.updateSettlementCosts(user, req.params.id, req.body.costItems);

      res.json({
        success: true,
        data: result,
        message: '成本项更新成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/settlements/:id/complete',
  authMiddleware,
  roleMiddleware('ADMIN'),
  [
    param('id').isString().notEmpty().withMessage('结算单ID不能为空'),
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
      const result = await settlementEngine.completeSettlement(user, req.params.id);

      res.json({
        success: true,
        data: result,
        message: '结算完成',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/settlements/:id/report',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('id').isString().notEmpty().withMessage('结算单ID不能为空'),
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

      const result = await settlementEngine.getSettlementReport(req.params.id);

      res.json({
        success: true,
        data: { content: result },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/statistics/business',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
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

      const { startDate, endDate } = req.query;

      const result = await settlementEngine.getBusinessStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

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
