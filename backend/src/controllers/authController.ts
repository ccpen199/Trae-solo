import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types/prisma';

export const registerValidation = [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度必须在3-20个字符之间'),
  body('password').isLength({ min: 6, max: 50 }).withMessage('密码长度必须在6-50个字符之间'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
];

export const loginValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
];

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  const { username, password, email, phone } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return errorResponse(res, 400, '用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        phone,
        role: 'USER' as UserRole,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        balance: true,
        status: true,
        createdAt: true,
      },
    });

    successResponse(res, user, '注册成功');
  } catch (error) {
    console.error('Register error:', error);
    errorResponse(res, 500, '注册失败');
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return errorResponse(res, 401, '用户名或密码错误');
    }

    if (user.status === 'BANNED') {
      return errorResponse(res, 403, '账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, '用户名或密码错误');
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    successResponse(
      res,
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          balance: user.balance,
          status: user.status,
        },
      },
      '登录成功'
    );
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 500, '登录失败');
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, '未登录');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        balance: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    successResponse(res, user);
  } catch (error) {
    console.error('Get current user error:', error);
    errorResponse(res, 500, '获取用户信息失败');
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, '未登录');
    }

    const { email, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        email,
        phone,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        balance: true,
        status: true,
      },
    });

    successResponse(res, user, '更新成功');
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, 500, '更新失败');
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, '未登录');
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, 400, '请输入原密码和新密码');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, '新密码长度不能少于6位');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return errorResponse(res, 404, '用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 400, '原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    successResponse(res, null, '密码修改成功');
  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, 500, '修改密码失败');
  }
};
