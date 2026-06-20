import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400);
    }

    const result = await authService.login(username, password);

    res.json({
      code: 200,
      message: '登录成功',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const user = authService.getCurrentUser(req.user.userId);

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError('未登录', 401);
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new AppError('原密码和新密码不能为空', 400);
    }

    await authService.changePassword(req.user.userId, oldPassword, newPassword);

    res.json({
      code: 200,
      message: '密码修改成功',
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
