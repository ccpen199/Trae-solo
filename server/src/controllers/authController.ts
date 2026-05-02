import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config, UserRole } from '../config';

export const loginValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
];

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.json({
        success: false,
        error: '用户名或密码错误',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({
        success: false,
        error: '用户名或密码错误',
      });
    }

    if (!user.isActive) {
      return res.json({
        success: false,
        error: '用户已被禁用',
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          phone: user.phone,
          department: user.department,
        },
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error('获取当前用户错误:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
};

export const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword').notEmpty().isLength({ min: 6 }).withMessage('新密码至少6位'),
];

export const changePassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: '原密码错误',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      error: '修改密码失败',
    });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;

    const where: any = {};

    if (role && Object.values(UserRole).includes(role as string)) {
      where.role = role as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { username: { contains: search as string } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败',
    });
  }
};
