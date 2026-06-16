import { Router, type Request, type Response } from 'express';
import { mockUsers, mockUser, type ApiResponse, type LoginRequest, type LoginResponse, type User } from '../data/mockData.js';
import { authMiddleware, generateToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, caCertificate }: LoginRequest = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      } as ApiResponse);
      return;
    }

    let user = mockUsers.find(u => u.idCard === username || u.name === username);
    
    if (!user) {
      user = mockUser;
    }

    const token = generateToken(user);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        user,
        expiresAt,
      },
      message: '登录成功',
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
    } as ApiResponse);
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: '登出成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登出失败',
    } as ApiResponse);
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || '1';
    const user = mockUsers.find(u => u.id === userId) || mockUser;

    res.status(200).json({
      success: true,
      data: user,
      message: '获取用户信息成功',
    } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    } as ApiResponse);
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || '1';
    const updateData = req.body;

    let user = mockUsers.find(u => u.id === userId) || mockUser;
    user = { ...user, ...updateData };

    res.status(200).json({
      success: true,
      data: user,
      message: '更新用户信息成功',
    } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
    } as ApiResponse);
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = req.body;

    if (!userData.name || !userData.idCard || !userData.phone) {
      res.status(400).json({
        success: false,
        message: '请填写完整的注册信息',
      } as ApiResponse);
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name,
      idCard: userData.idCard,
      phone: userData.phone,
      userType: userData.userType || 'citizen',
      authLevel: 1,
      avatar: userData.avatar || '',
      createdAt: new Date(),
    };

    const token = generateToken(newUser);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    res.status(201).json({
      success: true,
      data: {
        token,
        user: newUser,
        expiresAt,
      },
      message: '注册成功',
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
    } as ApiResponse);
  }
});

export default router;
