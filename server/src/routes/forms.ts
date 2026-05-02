import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { formEngine } from '../engines/form.engine';

const router = Router();

router.get(
  '/template/:tourId',
  authMiddleware,
  [
    param('tourId').isString().notEmpty().withMessage('线路ID不能为空'),
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

      const result = await formEngine.getTemplate(req.params.tourId);

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
  '/template/:tourId/preview',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('tourId').isString().notEmpty().withMessage('线路ID不能为空'),
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

      const result = await formEngine.generateFormPreview(req.params.tourId);

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
  '/template/:tourId',
  authMiddleware,
  roleMiddleware('SALES', 'ADMIN', 'AGENCY'),
  [
    param('tourId').isString().notEmpty().withMessage('线路ID不能为空'),
    body('name').optional().isString(),
    body('fields').isArray().withMessage('表单字段必须是数组'),
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
      const result = await formEngine.createOrUpdateTemplate(user, {
        tourId: req.params.tourId,
        name: req.body.name,
        fields: req.body.fields,
      });

      res.json({
        success: true,
        data: result,
        message: '表单模板保存成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/defaults',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = formEngine.getDefaultFields();

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
  '/validate',
  authMiddleware,
  [
    body('fields').isArray().withMessage('表单字段必须是数组'),
    body('values').isObject().withMessage('表单值必须是对象'),
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

      const { fields, values } = req.body;
      const result = formEngine.validateSubmission(fields, values);

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
  '/passengers/:orderId',
  authMiddleware,
  [
    param('orderId').isString().notEmpty().withMessage('订单ID不能为空'),
    body('passengers').isArray().withMessage('乘客信息必须是数组'),
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
      const result = await formEngine.savePassengers(user, req.params.orderId, req.body.passengers);

      res.json({
        success: true,
        data: result,
        message: '乘客信息保存成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
