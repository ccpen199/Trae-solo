import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../services/user.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }
  next();
};

// 注册
router.post(
  '/register',
  [
    body('username').isString().isLength({ min: 3, max: 20 }).withMessage('用户名长度应为3-20个字符'),
    body('password').isString().isLength({ min: 6, max: 32 }).withMessage('密码长度应为6-32个字符'),
    body('nickname').optional().isString().isLength({ max: 20 }).withMessage('昵称长度不能超过20个字符'),
    validate,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, nickname } = req.body;
      const user = await UserService.register(username, password, nickname);
      
      res.json({
        code: 200,
        message: '注册成功',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 登录
router.post(
  '/login',
  [
    body('username').isString().notEmpty().withMessage('用户名不能为空'),
    body('password').isString().notEmpty().withMessage('密码不能为空'),
    validate,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const result = await UserService.login(username, password);
      
      res.json({
        code: 200,
        message: '登录成功',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 退出登录
router.post(
  '/logout',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await UserService.logout(req.userId!);
      
      res.json({
        code: 200,
        message: '退出登录成功',
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取当前用户信息
router.get(
  '/profile',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.getProfile(req.userId!);
      
      res.json({
        code: 200,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// 更新用户信息
router.put(
  '/profile',
  authMiddleware,
  [
    body('nickname').optional().isString().isLength({ max: 20 }),
    body('avatar').optional(),
    body('email').optional().isEmail(),
    validate,
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { nickname, avatar, email } = req.body;
      const user = await UserService.updateProfile(req.userId!, {
        nickname,
        avatar,
        email,
      });
      
      res.json({
        code: 200,
        message: '更新成功',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
