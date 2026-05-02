import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { orderService } from '../services/order.service';
import { OrderStatus } from '../types/constants';

const router = Router();

router.get(
  '/',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(Object.values(OrderStatus)),
    query('groupId').optional().isString(),
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
      const { page = 1, pageSize = 20, status, groupId } = req.query;

      let touristId: string | undefined;
      if (user.role === 'TOURIST') {
        touristId = user.userId;
      }

      const result = await orderService.getOrderList({
        page: Number(page),
        pageSize: Number(pageSize),
        status: status as OrderStatus,
        touristId,
        groupId: groupId as string,
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
  '/:id',
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

      const order = await orderService.getOrder(req.params.id);

      res.json({
        success: true,
        data: order,
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
  roleMiddleware('TOURIST', 'SALES'),
  [
    body('groupId').isString().notEmpty().withMessage('团期ID不能为空'),
    body('contactName').isString().isLength({ min: 1, max: 50 }).withMessage('联系人姓名必填'),
    body('contactPhone').isString().isLength({ min: 11, max: 11 }).withMessage('联系电话格式不正确'),
    body('adultCount').isInt({ min: 0 }).withMessage('成人数必须大于等于0'),
    body('childCount').isInt({ min: 0 }).withMessage('儿童数必须大于等于0'),
    body('specialRequests').optional().isString(),
    body('passengers').optional().isArray(),
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
      const { adultCount, childCount } = req.body;

      if (adultCount + childCount <= 0) {
        return res.status(400).json({
          success: false,
          message: '报名人数必须大于0',
          error: 'INVALID_PASSENGER_COUNT',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
      }

      const result = await orderService.createOrder(user, req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: '订单创建成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/payment',
  authMiddleware,
  [
    param('id').isString().notEmpty().withMessage('订单ID不能为空'),
    body('amount').isFloat({ min: 0 }).withMessage('支付金额必须大于0'),
    body('method').isString().isIn(['ALIPAY', 'WECHAT', 'BANK', 'CASH']).withMessage('支付方式无效'),
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
      const { amount, method } = req.body;

      const result = await orderService.processPayment(user, req.params.id, amount, method);

      res.json({
        success: true,
        data: result,
        message: '支付成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/cancel',
  authMiddleware,
  [
    param('id').isString().notEmpty().withMessage('订单ID不能为空'),
    body('reason').optional().isString(),
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
      const result = await orderService.cancelOrder(user, req.params.id, req.body.reason);

      res.json({
        success: true,
        data: result,
        message: '订单已取消',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/confirm',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN'),
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

      const user = (req as AuthenticatedRequest).user;
      const result = await orderService.confirmOrder(user, req.params.id);

      res.json({
        success: true,
        data: result,
        message: '订单已确认',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN'),
  [
    param('id').isString().notEmpty().withMessage('订单ID不能为空'),
    body('status').isIn(Object.values(OrderStatus)).withMessage('状态无效'),
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
      const result = await orderService.updateOrderStatus(user, req.params.id, req.body.status);

      res.json({
        success: true,
        data: result,
        message: '订单状态已更新',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
