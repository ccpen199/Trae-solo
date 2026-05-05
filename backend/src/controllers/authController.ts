import type { Request, Response } from 'express';
import prisma from '../prisma/client.js';
import { generateToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { employee: true },
    });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: '账户已被禁用' });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId || undefined,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: user.employeeId,
        employeeName: user.employee?.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未授权' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
}

export async function createAdmin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    res.status(201).json({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: '创建管理员失败' });
  }
}
