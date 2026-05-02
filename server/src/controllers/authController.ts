import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { User, UserRole } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, JwtPayload } from '../middleware/auth';

const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password, name, email, phone, department, role } = req.body;

  if (!username || !password || !name) {
    throw new AppError('用户名、密码和姓名为必填项', 400);
  }

  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    throw new AppError('用户名已存在', 400);
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    username,
    password: hashedPassword,
    name,
    email,
    phone,
    department,
    role: role || UserRole.EXAMINEE,
    isActive: true,
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        department: user.department,
      },
      token,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('用户名和密码为必填项', 400);
  }

  const user = await User.findOne({ where: { username } });
  
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new AppError('用户名或密码错误', 401);
  }

  if (!user.isActive) {
    throw new AppError('账号已被禁用', 403);
  }

  await user.update({ lastLoginAt: new Date() });

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        department: user.department,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    },
  });
});

export const getCurrentUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'name', 'role', 'email', 'phone', 'department', 'isActive', 'lastLoginAt'],
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  }
);

export const updatePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('当前密码和新密码为必填项', 400);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (!(await verifyPassword(currentPassword, user.password))) {
      throw new AppError('当前密码错误', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password: hashedPassword });

    res.status(200).json({
      success: true,
      message: '密码更新成功',
    });
  }
);

export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { name, email, phone, department } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    await user.update({
      name: name ?? user.name,
      email: email ?? user.email,
      phone: phone ?? user.phone,
      department: department ?? user.department,
    });

    res.status(200).json({
      success: true,
      message: '个人信息更新成功',
      data: {
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
  }
);
