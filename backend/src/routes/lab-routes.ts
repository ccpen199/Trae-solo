import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { labService, CreateLabOrderRequest } from '../services/lab-service';
import { UserPayload, requireRole } from '../middleware/auth';

const router = Router();

router.get(
  '/pending',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as UserPayload;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const type = req.query.type as string | undefined;

      const result = await labService.getPendingLabOrders(user.roleCode, { limit, offset, type });

      res.json({
        success: true,
        data: {
          orders: result.orders,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error('Get pending lab orders error:', error);
      res.status(500).json({
        success: false,
        error: '获取待处理检查单列表失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/:orderId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;

      const order = await labService.getLabOrderById(orderId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error('Get lab order error:', error);
      
      if (error.message === '检查单不存在') {
        res.status(404).json({
          success: false,
          error: '检查单不存在',
          code: 'LAB_ORDER_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '获取检查单详情失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/',
  requireRole('DOCTOR'),
  [
    body('visitId').notEmpty().withMessage('就诊ID不能为空'),
    body('type').isIn(['LAB', 'IMAGING', 'FUNCTION']).withMessage('检查类型无效'),
    body('urgency').isIn(['ROUTINE', 'URGENT', 'STAT']).withMessage('紧急程度无效'),
    body('items').isArray({ min: 1 }).withMessage('检查项目不能为空'),
    body('items.*.itemName').notEmpty().withMessage('项目名称不能为空'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('数量必须大于0'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';
      const request: CreateLabOrderRequest = req.body;

      const order = await labService.createLabOrder(request, user, ipAddress);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error('Create lab order error:', error);
      
      if (error.message === '就诊记录不存在') {
        res.status(404).json({
          success: false,
          error: '就诊记录不存在',
          code: 'VISIT_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '创建检查单失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/:orderId/start',
  requireRole('NURSE', 'TECHNICIAN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const order = await labService.startLabOrder(orderId, user, ipAddress);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error('Start lab order error:', error);
      
      if (error.message === '检查单不存在') {
        res.status(404).json({
          success: false,
          error: '检查单不存在',
          code: 'LAB_ORDER_NOT_FOUND',
        });
        return;
      }

      if (error.message === '检查单状态不允许开始') {
        res.status(400).json({
          success: false,
          error: '检查单状态不允许开始',
          code: 'INVALID_STATUS',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '开始检查失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/:orderId/complete',
  requireRole('NURSE', 'TECHNICIAN'),
  [
    body('result').notEmpty().withMessage('检查结果不能为空'),
    body('itemResults').isArray().withMessage('项目结果格式不正确'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const { orderId } = req.params;
      const { result, itemResults } = req.body;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const order = await labService.completeLabOrder(orderId, result, itemResults, user, ipAddress);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error('Complete lab order error:', error);
      
      if (error.message === '检查单不存在') {
        res.status(404).json({
          success: false,
          error: '检查单不存在',
          code: 'LAB_ORDER_NOT_FOUND',
        });
        return;
      }

      if (error.message === '检查单状态不允许完成') {
        res.status(400).json({
          success: false,
          error: '检查单状态不允许完成',
          code: 'INVALID_STATUS',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '完成检查失败',
        message: error.message,
      });
    }
  }
);

router.post(
  '/:orderId/cancel',
  requireRole('DOCTOR'),
  [
    body('cancelReason').notEmpty().withMessage('取消原因不能为空'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const { orderId } = req.params;
      const { cancelReason } = req.body;
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const order = await labService.cancelLabOrder(orderId, cancelReason, user, ipAddress);

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error('Cancel lab order error:', error);
      
      if (error.message === '检查单不存在') {
        res.status(404).json({
          success: false,
          error: '检查单不存在',
          code: 'LAB_ORDER_NOT_FOUND',
        });
        return;
      }

      if (error.message === '检查单状态不允许取消') {
        res.status(400).json({
          success: false,
          error: '检查单状态不允许取消',
          code: 'INVALID_STATUS',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '取消检查单失败',
        message: error.message,
      });
    }
  }
);

router.get(
  '/visit/:visitId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { visitId } = req.params;

      const orders = await labService.getVisitLabOrders(visitId);

      res.json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      console.error('Get visit lab orders error:', error);
      res.status(500).json({
        success: false,
        error: '获取就诊检查单列表失败',
        message: error.message,
      });
    }
  }
);

export default router;
