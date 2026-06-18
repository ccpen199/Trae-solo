import { Router, type Request, type Response } from 'express';
import { getData } from '../data/mockData.js';

const router = Router();

const ACCOUNTS: Record<string, { password: string; role: string; name: string; district?: string; scenicId?: string; merchantId?: string; permissions: string[] }> = {
  admin: {
    password: 'admin123',
    role: 'super_admin',
    name: '超级管理员',
    permissions: ['dashboard', 'citizens', 'transactions', 'transport', 'scenics', 'scenic-heatmap', 'enterprises', 'merchants', 'transport-top', 'fusing', 'audit'],
  },
  platform: {
    password: 'platform123',
    role: 'admin',
    name: '市级运营管理员',
    permissions: ['dashboard', 'citizens', 'transactions', 'transport', 'scenics', 'scenic-heatmap', 'enterprises', 'merchants', 'transport-top', 'fusing', 'audit'],
  },
  scenic_admin: {
    password: 'scenic123',
    role: 'scenic_admin',
    name: '景区运营管理员',
    district: '姑苏区',
    scenicId: 'scenic-001',
    permissions: ['dashboard', 'scenics', 'scenic-heatmap'],
  },
  merchant_admin: {
    password: 'merchant123',
    role: 'merchant_admin',
    name: '商户运营管理员',
    district: '工业园区',
    merchantId: 'merchant-001',
    permissions: ['dashboard', 'merchants'],
  },
};

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      success: false,
      message: '用户名和密码不能为空',
      code: 'EMPTY_FIELDS',
    });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 600));

  const account = ACCOUNTS[username];
  if (!account) {
    res.status(401).json({
      success: false,
      message: '账号不存在，请检查用户名',
      code: 'USER_NOT_FOUND',
    });
    return;
  }

  if (account.password !== password) {
    res.status(401).json({
      success: false,
      message: '密码错误，请重新输入',
      code: 'WRONG_PASSWORD',
    });
    return;
  }

  const user = {
    id: `user-${username}`,
    username,
    name: account.name,
    role: account.role,
    district: account.district,
    scenicId: account.scenicId,
    merchantId: account.merchantId,
    lastLoginAt: new Date(),
    permissions: account.permissions,
  };

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token: 'mock-jwt-token-' + Date.now(),
      user,
    },
  });
});

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: '注销成功',
  });
});

router.get('/me', async (_req: Request, res: Response): Promise<void> => {
  const data = getData();
  res.json({
    success: true,
    data: data.mockUser,
  });
});

export default router;
