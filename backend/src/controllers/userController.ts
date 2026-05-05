import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { Role } from '../constants/status';

// 获取所有用户（管理员）
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 获取所有员工（主管创建任务时选择实施人）
export async function getEmployees(req: Request, res: Response) {
  try {
    const employees = await prisma.user.findMany({
      where: { 
        role: Role.EMPLOYEE,
        isActive: true 
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('获取员工列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 创建用户（管理员）
export async function createUser(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const { username, email, password, name, role } = req.body;

  try {
    // 检查用户名是否存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在',
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role: role as string,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: user,
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 更新用户（管理员）
export async function updateUser(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { email, name, role, isActive, password } = req.body;

  try {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 检查邮箱是否被其他用户使用
    if (email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被其他用户使用',
        });
      }
    }

    const updateData: any = {
      ...(email && { email }),
      ...(name && { name }),
      ...(role && { role: role as string }),
      ...(isActive !== undefined && { isActive }),
    };

    // 如果提供了密码，则更新密码
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: '用户更新成功',
      data: user,
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 删除用户（管理员 - 软删除）
export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 软删除：设置 isActive 为 false
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: '用户已禁用',
      data: user,
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 验证规则
export const createUserValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('role').isIn(['ADMIN', 'SUPERVISOR', 'EMPLOYEE']).withMessage('角色无效'),
];

export const updateUserValidation = [
  param('id').notEmpty().withMessage('用户ID不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('name').optional().notEmpty().withMessage('姓名不能为空'),
  body('role').optional().isIn(['ADMIN', 'SUPERVISOR', 'EMPLOYEE']).withMessage('角色无效'),
  body('isActive').optional().isBoolean().withMessage('状态必须是布尔值'),
  body('password').optional().isLength({ min: 6 }).withMessage('密码至少6位'),
];
