import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { PlanStatus, TaskStatus, Role } from '../constants/status';

// 获取任务下的所有计划
export async function getPlansByTask(req: Request, res: Response) {
  const { taskId } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    // 权限检查
    const isCreator = task.creatorId === userId;
    const isAssignee = task.assigneeId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isCreator && !isAssignee && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权查看此任务的计划',
      });
    }

    const plans = await prisma.plan.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('获取计划列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 创建计划（员工）
export async function createPlan(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const employeeId = req.user?.userId;
  const { taskId, title, description, startTime, endTime } = req.body;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    // 权限检查：只有被分配的员工可以创建计划
    if (task.assigneeId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: '无权为此任务创建计划',
      });
    }

    // 状态检查：任务必须是待实施或实施中
    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        message: '只有待实施或实施中的任务可以创建计划',
      });
    }

    const plan = await prisma.plan.create({
      data: {
        taskId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: PlanStatus.DRAFT,
        creatorId: employeeId!,
      },
    });

    // 如果任务还是待实施状态，自动开始
    if (task.status === TaskStatus.PENDING) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });
    }

    res.status(201).json({
      success: true,
      message: '计划创建成功',
      data: plan,
    });
  } catch (error) {
    console.error('创建计划错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 更新计划（员工）
export async function updatePlan(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const employeeId = req.user?.userId;
  const { title, description, startTime, endTime, status } = req.body;

  try {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '计划不存在',
      });
    }

    // 权限检查：只有创建者可以修改
    if (plan.creatorId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: '无权修改此计划',
      });
    }

    // 状态检查：如果任务已完成，则不能修改计划
    if (
      plan.task.status === TaskStatus.COMPLETED ||
      plan.task.status === TaskStatus.CONFIRMED ||
      plan.task.status === TaskStatus.ARCHIVED
    ) {
      return res.status(400).json({
        success: false,
        message: '任务已完成，无法修改计划',
      });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status as string;

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: '计划更新成功',
      data: updatedPlan,
    });
  } catch (error) {
    console.error('更新计划错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 删除计划（员工）
export async function deletePlan(req: Request, res: Response) {
  const { id } = req.params;
  const employeeId = req.user?.userId;

  try {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '计划不存在',
      });
    }

    // 权限检查：只有创建者可以删除
    if (plan.creatorId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此计划',
      });
    }

    // 状态检查：如果任务已完成，则不能删除计划
    if (
      plan.task.status === TaskStatus.COMPLETED ||
      plan.task.status === TaskStatus.CONFIRMED ||
      plan.task.status === TaskStatus.ARCHIVED
    ) {
      return res.status(400).json({
        success: false,
        message: '任务已完成，无法删除计划',
      });
    }

    await prisma.plan.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '计划删除成功',
    });
  } catch (error) {
    console.error('删除计划错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 验证规则
export const createPlanValidation = [
  body('taskId').notEmpty().withMessage('任务ID不能为空'),
  body('title').notEmpty().withMessage('计划名称不能为空'),
  body('startTime').notEmpty().isISO8601().withMessage('开始时间格式不正确'),
  body('endTime').notEmpty().isISO8601().withMessage('结束时间格式不正确'),
];

export const updatePlanValidation = [
  param('id').notEmpty().withMessage('计划ID不能为空'),
  body('title').optional().notEmpty().withMessage('计划名称不能为空'),
  body('startTime').optional().isISO8601().withMessage('开始时间格式不正确'),
  body('endTime').optional().isISO8601().withMessage('结束时间格式不正确'),
  body('status').optional().isIn(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).withMessage('状态无效'),
];
