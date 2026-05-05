import type { Request, Response } from 'express';
import { Prisma, type UserRole } from '@prisma/client';
import prisma from '../prisma/client.js';
import { hashPassword } from '../utils/password.js';

export async function getUsers(req: Request, res: Response) {
  try {
    const { username, role, page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const where: Prisma.UserWhereInput = {};

    if (username) {
      where.username = { contains: username as string };
    }
    if (role) {
      where.role = role as UserRole;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          employee: {
            include: { department: true },
          },
        },
        skip,
        take: sizeNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      employeeId: u.employeeId,
      employee: u.employee,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    res.json({
      data: safeUsers,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(safeUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const data = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    if (data.employeeId) {
      const existingUserWithEmployee = await prisma.user.findFirst({
        where: { employeeId: data.employeeId },
      });
      if (existingUserWithEmployee) {
        return res.status(400).json({ error: '该员工已关联用户' });
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role || 'USER',
        employeeId: data.employeeId,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: '创建用户失败' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id },
        },
      });
      if (existingUser) {
        return res.status(400).json({ error: '用户名已存在' });
      }
    }

    if (data.employeeId) {
      const existingUserWithEmployee = await prisma.user.findFirst({
        where: {
          employeeId: data.employeeId,
          NOT: { id },
        },
      });
      if (existingUserWithEmployee) {
        return res.status(400).json({ error: '该员工已关联其他用户' });
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      username: data.username,
      role: data.role,
      employeeId: data.employeeId,
      isActive: data.isActive,
    };

    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(safeUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新用户失败' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const currentUserId = req.user?.userId;
    if (currentUserId === id) {
      return res.status(400).json({ error: '不能删除当前登录的用户' });
    }

    await prisma.user.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
}

export async function updateCurrentUserPassword(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const { comparePassword } = await import('../utils/password.js');
    const passwordMatch = await comparePassword(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: '原密码错误' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: '密码修改失败' });
  }
}
