import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth';
import securityVault from '../engines/security-vault';

const router = Router();

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
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { username, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || !user.isActive) {
        await securityVault.recordAuditLog({
          userId: user?.id || 'unknown',
          action: 'LOGIN',
          module: 'AUTH',
          targetType: 'User',
          status: 'FAILED',
          errorMessage: '用户不存在或已被禁用',
          ipAddress: req.ip,
        });

        return res.status(401).json({ 
          success: false, 
          error: '用户名或密码错误' 
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await securityVault.recordAuditLog({
          userId: user.id,
          action: 'LOGIN',
          module: 'AUTH',
          targetType: 'User',
          targetId: user.id,
          status: 'FAILED',
          errorMessage: '密码错误',
          ipAddress: req.ip,
        });

        return res.status(401).json({ 
          success: false, 
          error: '用户名或密码错误' 
        });
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department || undefined,
      });

      await securityVault.recordAuditLog({
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        targetType: 'User',
        targetId: user.id,
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            department: user.department,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        error: '登录失败' 
      });
    }
  }
);

router.post(
  '/logout',
  authMiddleware(),
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.user) {
        await securityVault.recordAuditLog({
          userId: req.user.userId,
          action: 'LOGOUT',
          module: 'AUTH',
          targetType: 'User',
          targetId: req.user.userId,
          status: 'SUCCESS',
          ipAddress: req.ip,
        });
      }

      res.json({
        success: true,
        message: '已登出',
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: '登出失败' 
      });
    }
  }
);

router.get('/me', authMiddleware(), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: '获取用户信息失败' 
    });
  }
});

export default router;
