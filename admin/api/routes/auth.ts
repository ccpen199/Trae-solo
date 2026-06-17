/**
 * 用户认证API路由
 */
import { Router, type Request, type Response } from 'express';
import { mockUser, getData } from '../data/mockData.js';

const router = Router();

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      success: false,
      message: '用户名和密码不能为空',
    });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 800));

  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          ...mockUser,
          lastLoginAt: new Date(),
        },
      },
    });
    return;
  }

  res.status(401).json({
    success: false,
    message: '用户名或密码错误',
  });
});

/**
 * 用户注销
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: '注销成功',
  });
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const data = getData();
  res.json({
    success: true,
    data: data.mockUser,
  });
});

export default router;
