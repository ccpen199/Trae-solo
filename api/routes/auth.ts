import { Router, type Request, type Response } from 'express';
import type { ApiResponse, AuthRequest, AuthResponse, UserInfo } from '@shared/types';
import { getDb } from '../models/db.js';
import { generateToken, verifyToken, type AuthRequest as AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { credentialType, credentialData, deviceId } = req.body as AuthRequest;
  
  if (!credentialType || !credentialData || !deviceId) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '缺少必要参数',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id_card = ? OR social_security_no = ?').get(
    '320101198501011234',
    '100000000001'
  ) as any;
  
  if (!user) {
    const response: ApiResponse<null> = {
      code: 401,
      message: '用户不存在或认证失败',
      data: null
    };
    res.status(401).json(response);
    return;
  }
  
  const userInfo: UserInfo = {
    id: user.id,
    name: user.name,
    idCard: user.id_card,
    socialSecurityNo: user.social_security_no,
    insuredArea: user.insured_area,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei'
  };
  
  const token = generateToken(userInfo);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  
  const response: ApiResponse<AuthResponse> = {
    code: 0,
    message: '登录成功',
    data: {
      success: true,
      token,
      userInfo,
      expiresAt
    }
  };
  
  res.json(response);
});

router.post('/logout', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const response: ApiResponse<{ success: boolean }> = {
    code: 0,
    message: '登出成功',
    data: { success: true }
  };
  res.json(response);
});

router.get('/verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse<{ valid: boolean }> = {
      code: 0,
      message: 'Token无效',
      data: { valid: false }
    };
    res.json(response);
    return;
  }
  
  const token = authHeader.substring(7);
  const userInfo = verifyToken(token);
  
  const response: ApiResponse<{ valid: boolean; user?: UserInfo }> = {
    code: 0,
    message: userInfo ? 'Token有效' : 'Token无效',
    data: {
      valid: !!userInfo,
      user: userInfo || undefined
    }
  };
  
  res.json(response);
});

export default router;
