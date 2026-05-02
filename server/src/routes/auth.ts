import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { authService } from '../services/auth.service';
import { UserRole } from '../types/constants';

const router = Router();

router.post(
  '/register',
  [
    body('username').isString().isLength({ min: 3, max: 50 }).withMessage('用户名长度为3-50个字符'),
    body('password').isString().isLength({ min: 6, max: 100 }).withMessage('密码长度至少6个字符'),
    body('name').isString().isLength({ min: 1, max: 50 }).withMessage('姓名不能为空'),
    body('phone').optional().isString().isLength({ min: 11, max: 11 }).withMessage('手机号格式不正确'),
    body('email').optional().isEmail().withMessage('邮箱格式不正确'),
    body('role').optional().isIn(Object.values(UserRole)).withMessage('角色无效'),
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

      const result = await authService.register(req.body);

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
  '/login',
  [
    body('username').isString().notEmpty().withMessage('用户名不能为空'),
    body('password').isString().notEmpty().withMessage('密码不能为空'),
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

      const result = await authService.login(req.body);

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
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const result = await authService.getCurrentUser(user.userId);

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
  '/me',
  authMiddleware,
  [
    body('name').optional().isString().isLength({ min: 1, max: 50 }),
    body('phone').optional().isString().isLength({ min: 11, max: 11 }),
    body('email').optional().isEmail(),
    body('avatar').optional().isString(),
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
      const result = await authService.updateUser(user.userId, req.body);

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
  '/change-password',
  authMiddleware,
  [
    body('oldPassword').isString().notEmpty().withMessage('原密码不能为空'),
    body('newPassword').isString().isLength({ min: 6 }).withMessage('新密码长度至少6个字符'),
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
      const { oldPassword, newPassword } = req.body;

      await authService.changePassword(user.userId, oldPassword, newPassword);

      res.json({
        success: true,
        message: '密码修改成功',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
