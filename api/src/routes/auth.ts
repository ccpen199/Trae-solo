import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { User } from '../../../shared/types';
import { mockUsers, mockPasswords } from '../data/mockData';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6个字符'),
});

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  password: z.string().min(6, '密码至少6个字符').max(32, '密码最多32个字符'),
  role: z.enum(['artist', 'agency_admin', 'company_hr']).default('artist'),
  realName: z.string().min(2, '真实姓名至少2个字符').optional(),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = mockUsers.find(u => u.email.toLowerCase() === validated.email.toLowerCase());
    if (!user) {
      res.status(401).json({ error: '邮箱或密码错误', code: 'INVALID_CREDENTIALS' });
      return;
    }

    const passwordRecord = mockPasswords.find(p => p.userId === user.id);
    const isValid = passwordRecord
      ? await bcrypt.compare(validated.password, passwordRecord.passwordHash)
      : validated.password === 'password123';

    if (!isValid) {
      res.status(401).json({ error: '邮箱或密码错误', code: 'INVALID_CREDENTIALS' });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(500).json({ error: '登录失败', code: 'SERVER_ERROR' });
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = mockUsers.find(
      u => u.email.toLowerCase() === validated.email.toLowerCase() || u.phone === validated.phone
    );

    if (existingUser) {
      res.status(409).json({ error: '用户已存在', code: 'USER_EXISTS' });
      return;
    }

    const newUserId = `user-${Date.now()}`;
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const newUser: User = {
      id: newUserId,
      email: validated.email,
      phone: validated.phone,
      role: validated.role,
      isVerified: false,
      createdAt: new Date(),
    };

    mockUsers.push(newUser);
    mockPasswords.push({
      userId: newUserId,
      passwordHash: hashedPassword,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt,
      },
      message: '注册成功，请完成实名认证',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(500).json({ error: '注册失败', code: 'SERVER_ERROR' });
  }
});

router.get('/profile', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证', code: 'UNAUTHENTICATED' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    },
  });
});

router.post('/logout', authenticateToken, (_req: AuthRequest, res: Response): void => {
  res.status(200).json({
    success: true,
    message: '登出成功',
  });
});

export default router;
