import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest, ApiResponse, LoginParams, RegisterParams } from '../types/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, password }: LoginParams = req.body;

    if (!phone || !password) {
      const response: ApiResponse = {
        success: false,
        message: '请输入手机号和密码',
      };
      return res.status(400).json(response);
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: '用户不存在',
      };
      return res.status(404).json(response);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const response: ApiResponse = {
        success: false,
        message: '密码错误',
      };
      return res.status(400).json(response);
    }

    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        },
      },
      message: '登录成功',
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      message: '登录失败，请稍后重试',
    };
    res.status(500).json(response);
  }
});

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, password, nickname }: RegisterParams = req.body;

    if (!phone || !password) {
      const response: ApiResponse = {
        success: false,
        message: '请输入手机号和密码',
      };
      return res.status(400).json(response);
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: '该手机号已被注册',
      };
      return res.status(400).json(response);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        nickname: nickname || `用户${phone.slice(-4)}`,
      },
    });

    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        },
      },
      message: '注册成功',
    };

    res.json(response);
  } catch (error) {
    console.error('Register error:', error);
    const response: ApiResponse = {
      success: false,
      message: '注册失败，请稍后重试',
    };
    res.status(500).json(response);
  }
});

router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: '用户ID不存在',
      };
      return res.status(401).json(response);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        host: true,
      },
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: '用户不存在',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        host: user.host
          ? {
              id: user.host.id,
              realName: user.host.realName,
              intro: user.host.intro,
              responseRate: user.host.responseRate,
              responseTime: user.host.responseTime,
              verifyStatus: user.host.verifyStatus,
            }
          : null,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Get profile error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取用户信息失败',
    };
    res.status(500).json(response);
  }
});

router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: '已退出登录',
  };
  res.json(response);
});

export default router;
