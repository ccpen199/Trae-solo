import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { TaskStatus, Role } from '../constants/status';

// 获取任务下的所有反馈
export async function getFeedbacksByTask(req: Request, res: Response) {
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
        message: '无权查看此任务的反馈',
      });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { taskId },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error('获取反馈列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 提交反馈（员工）
export async function submitFeedback(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const employeeId = req.user?.userId;
  const { taskId, content } = req.body;

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

    // 权限检查：只有被分配的员工可以提交反馈
    if (task.assigneeId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: '无权为此任务提交反馈',
      });
    }

    // 状态检查：任务必须是实施中
    if (task.status !== TaskStatus.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        message: '只有实施中的任务可以提交反馈',
      });
    }

    // 检查所有计划是否已完成
    const plans = await prisma.plan.findMany({
      where: { taskId },
    });

    const allPlansCompleted = plans.length > 0 && plans.every(p => p.status === 'COMPLETED');
    
    if (!allPlansCompleted) {
      return res.status(400).json({
        success: false,
        message: '请先完成所有计划后再提交反馈',
      });
    }

    // 创建反馈
    const feedback = await prisma.feedback.create({
      data: {
        taskId,
        content,
        creatorId: employeeId!,
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    // 更新任务状态为已完成
    await prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.COMPLETED },
    });

    res.status(201).json({
      success: true,
      message: '反馈提交成功，任务已标记为已完成',
      data: feedback,
    });
  } catch (error) {
    console.error('提交反馈错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 验证规则
export const submitFeedbackValidation = [
  body('taskId').notEmpty().withMessage('任务ID不能为空'),
  body('content').notEmpty().withMessage('反馈内容不能为空'),
];
