import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { authMiddleware, AuthRequest, auditMiddleware } from '../middleware';
import { logger } from '../lib/logger';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('请提供有效的邮箱地址'),
    body('password').isLength({ min: 8 }).withMessage('密码至少8位'),
    body('name').notEmpty().withMessage('请提供姓名'),
  ],
  auditMiddleware('USER_REGISTER', 'User'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { email, password, name, role } = req.body;
      
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: '该邮箱已被注册',
        });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'VIEWER',
        },
      });
      
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      logger.info(`User registered: ${email}`);
      
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: '注册失败',
      });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('请提供有效的邮箱地址'),
    body('password').notEmpty().withMessage('请提供密码'),
  ],
  auditMiddleware('USER_LOGIN', 'User'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }
      
      const { email, password } = req.body;
      
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: '邮箱或密码错误',
        });
      }
      
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: '账户已被禁用',
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: '邮箱或密码错误',
        });
      }
      
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      
      logger.info(`User logged in: ${email}`);
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: '登录失败',
      });
    }
  }
);

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
});

router.get(
  '/users',
  authMiddleware,
  auditMiddleware('LIST_USERS', 'User'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      
      const where: Record<string, unknown> = {};
      
      if (search && typeof search === 'string') {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('List users error:', error);
      res.status(500).json({
        success: false,
        error: '获取用户列表失败',
      });
    }
  }
);

export default router;
