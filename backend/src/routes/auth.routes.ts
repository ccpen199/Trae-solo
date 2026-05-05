import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import userService from '../services/user.service';

const router = Router();

router.post(
  '/register',
  [
    body('username').isLength({ min: 3, max: 50 }).withMessage('用户名长度需在3-50之间'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('name').notEmpty().withMessage('姓名不能为空'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await userService.register({
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await userService.login({
        username: req.body.username,
        password: req.body.password,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
