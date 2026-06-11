import { Router, type Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticateToken,
  successResponse,
  errorResponse,
  type AuthRequest,
} from '../middleware/auth';
import { authService } from '../services/AuthService';
import type { LoginRequest, LoginResponse } from '../../shared/types';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'wenlv-zhongtai-secret-key-2024';

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      errorResponse(res, 400, '用户名和密码不能为空');
      return;
    }

    const result = await authService.login(username, password);

    if (!result.success || !result.data) {
      errorResponse(res, 401, result.message);
      return;
    }

    successResponse<LoginResponse>(res, result.data, result.message);
  } catch (error) {
    errorResponse(res, 500, '登录失败，请稍后重试');
  }
});

router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    successResponse(res, null, '登出成功');
  } catch (error) {
    errorResponse(res, 500, '登出失败，请稍后重试');
  }
});

router.post('/refresh', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!refreshToken) {
      errorResponse(res, 401, '未提供刷新令牌');
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
      const result = await authService.refreshToken(decoded.userId);

      if (!result.success || !result.data) {
        errorResponse(res, 401, result.message);
        return;
      }

      successResponse<LoginResponse>(res, result.data, result.message);
    } catch (jwtError) {
      errorResponse(res, 403, '刷新令牌无效或已过期');
    }
  } catch (error) {
    errorResponse(res, 500, '刷新令牌失败，请稍后重试');
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 401, '请先登录');
      return;
    }

    const result = await authService.getCurrentUser(req.user.id);

    if (!result) {
      errorResponse(res, 404, '用户不存在');
      return;
    }

    successResponse(res, result, '获取用户信息成功');
  } catch (error) {
    errorResponse(res, 500, '获取用户信息失败，请稍后重试');
  }
});

router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 401, '请先登录');
      return;
    }

    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

    if (!oldPassword || !newPassword) {
      errorResponse(res, 400, '原密码和新密码不能为空');
      return;
    }

    if (newPassword.length < 6) {
      errorResponse(res, 400, '新密码长度不能少于6位');
      return;
    }

    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);

    if (!result.success) {
      errorResponse(res, 400, result.message);
      return;
    }

    successResponse(res, null, result.message);
  } catch (error) {
    errorResponse(res, 500, '修改密码失败，请稍后重试');
  }
});

export default router;
