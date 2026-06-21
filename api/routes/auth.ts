import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { mockUsers, mockCurrentUser, demoAccounts } from '../mock/data';
import type { ApiResponse, User, UserRole } from '../../shared/types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'recycle_platform_secret_key';

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { phone, password, role, companyName } = req.body;
  
  if (!phone || !password || !role || !companyName) {
    res.status(400).json({
      success: false,
      message: '请填写完整的注册信息',
    });
    return;
  }

  const newUser: User = {
    id: Math.random().toString(36).substring(2, 9),
    phone,
    role: role as UserRole,
    companyName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const response: ApiResponse<{ userId: string }> = {
    success: true,
    data: { userId: newUser.id },
    message: '注册成功，请等待资质审核',
  };
  res.json(response);
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, password, role } = req.body;
  
  if (!phone || !password) {
    res.status(400).json({
      success: false,
      message: '请输入账号和密码',
    });
    return;
  }

  const demoAccount = demoAccounts.find(acc => acc.phone === phone);
  if (demoAccount) {
    if (demoAccount.password !== password) {
      res.status(401).json({
        success: false,
        message: '密码错误',
      });
      return;
    }

    const user = mockUsers.find(u => u.phone === phone && u.status === 'approved');
    if (!user) {
      res.status(401).json({
        success: false,
        message: '账号不存在',
      });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response: ApiResponse<{ token: string; user: User }> = {
      success: true,
      data: { token, user },
      message: `登录成功，欢迎${user.role === 'supplier' ? '货源方' : user.role === 'buyer' ? '采购方' : '运营方'}`,
    };
    res.json(response);
    return;
  }

  const user = mockUsers.find(u => u.phone === phone && u.status === 'approved');
  
  if (!user) {
    res.status(401).json({
      success: false,
      message: '账号不存在或未通过审核',
    });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const response: ApiResponse<{ token: string; user: User }> = {
    success: true,
    data: { token, user },
    message: '登录成功',
  };
  res.json(response);
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: '未授权访问',
    });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; phone: string };
    
    const user = mockUsers.find(u => u.id === decoded.userId || u.phone === decoded.phone);
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const response: ApiResponse<{ user: User }> = {
      success: true,
      data: { user },
    };
    res.json(response);
  } catch {
    res.status(401).json({
      success: false,
      message: 'Token已过期，请重新登录',
    });
  }
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const response: ApiResponse<null> = {
    success: true,
    message: '已退出登录',
  };
  res.json(response);
});

export default router;
