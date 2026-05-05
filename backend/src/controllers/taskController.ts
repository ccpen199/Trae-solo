import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { TaskStatus, Role } from '../constants/status';

// 获取任务列表（主管 - 自己创建的任务）
export async function getTasksBySupervisor(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const supervisorId = req.user?.userId;
  const {
    assigneeId,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    pageSize = '20',
  } = req.query;

  try {
    const where: any = {
      creatorId: supervisorId,
    };

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (status) {
      where.status = status as string;
    }

    const orderBy: any = {};
    if (['assigneeId', 'status', 'startTime', 'endTime', 'createdAt'].includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, username: true },
          },
          assignee: {
            select: { id: true, name: true, username: true },
          },
          _count: {
            select: { plans: true, feedbacks: true },
          },
        },
        orderBy,
        skip,
        take: sizeNum,
      }),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: pageNum,
          pageSize: sizeNum,
          total,
          totalPages: Math.ceil(total / sizeNum),
        },
      },
    });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 获取任务列表（员工 - 分配给自己的任务）
export async function getTasksByEmployee(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const employeeId = req.user?.userId;
  const {
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    pageSize = '20',
  } = req.query;

  try {
    const where: any = {
      assigneeId: employeeId,
    };

    if (status) {
      where.status = status as string;
    }

    const orderBy: any = {};
    if (['status', 'startTime', 'endTime', 'createdAt'].includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * sizeNum;

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, username: true },
          },
          assignee: {
            select: { id: true, name: true, username: true },
          },
          _count: {
            select: { plans: true, feedbacks: true },
          },
        },
        orderBy,
        skip,
        take: sizeNum,
      }),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: pageNum,
          pageSize: sizeNum,
          total,
          totalPages: Math.ceil(total / sizeNum),
        },
      },
    });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 获取任务详情
export async function getTaskDetail(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, username: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, username: true, role: true },
        },
        plans: {
          orderBy: { createdAt: 'asc' },
        },
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    // 权限检查：只有创建者、被分配者或管理员可以查看
    const isCreator = task.creatorId === userId;
    const isAssignee = task.assigneeId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isCreator && !isAssignee && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权查看此任务',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('获取任务详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 创建任务（主管）
export async function createTask(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const creatorId = req.user?.userId;
  const { title, description, startTime, endTime, assigneeId } = req.body;

  try {
    // 验证实施人是员工
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee || assignee.role !== Role.EMPLOYEE || !assignee.isActive) {
      return res.status(400).json({
        success: false,
        message: '实施人不存在或不是有效的员工',
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: TaskStatus.PENDING,
        creatorId: creatorId!,
        assigneeId,
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true },
        },
        assignee: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: task,
    });
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 更新任务（主管）
export async function updateTask(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const supervisorId = req.user?.userId;
  const { title, description, startTime, endTime, assigneeId } = req.body;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    // 权限检查：只有创建者可以修改
    if (task.creatorId !== supervisorId) {
      return res.status(403).json({
        success: false,
        message: '无权修改此任务',
      });
    }

    // 状态检查：只有待实施状态可以修改所有字段
    if (task.status !== TaskStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: '只有待实施状态的任务可以修改',
      });
    }

    // 如果修改实施人，验证新的实施人是员工
    if (assigneeId && assigneeId !== task.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee || assignee.role !== Role.EMPLOYEE || !assignee.isActive) {
        return res.status(400).json({
          success: false,
          message: '实施人不存在或不是有效的员工',
        });
      }
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (assigneeId) updateData.assigneeId = assigneeId;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, username: true },
        },
        assignee: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    res.json({
      success: true,
      message: '任务更新成功',
      data: updatedTask,
    });
  } catch (error) {
    console.error('更新任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 删除任务（主管）
export async function deleteTask(req: Request, res: Response) {
  const { id } = req.params;
  const supervisorId = req.user?.userId;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    // 权限检查：只有创建者可以删除
    if (task.creatorId !== supervisorId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此任务',
      });
    }

    // 状态检查：只有待实施状态可以删除
    if (task.status !== TaskStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: '只有待实施状态的任务可以删除',
      });
    }

    // 删除关联的计划和反馈
    await prisma.$transaction([
      prisma.feedback.deleteMany({ where: { taskId: id } }),
      prisma.plan.deleteMany({ where: { taskId: id } }),
      prisma.task.delete({ where: { id } }),
    ]);

    res.json({
      success: true,
      message: '任务删除成功',
    });
  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 员工开始任务（从待实施到实施中）
export async function startTask(req: Request, res: Response) {
  const { id } = req.params;
  const employeeId = req.user?.userId;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    // 权限检查：只有被分配的员工可以开始
    if (task.assigneeId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此任务',
      });
    }

    // 状态检查：只有待实施状态可以开始
    if (task.status !== TaskStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: '只有待实施状态的任务可以开始',
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.IN_PROGRESS },
      include: {
        creator: {
          select: { id: true, name: true, username: true },
        },
        assignee: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    res.json({
      success: true,
      message: '任务已开始',
      data: updatedTask,
    });
  } catch (error) {
    console.error('开始任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 主管确认任务完成
export async function confirmTask(req: Request, res: Response) {
  const { id } = req.params;
  const supervisorId = req.user?.userId;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    // 权限检查：只有创建者可以确认
    if (task.creatorId !== supervisorId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此任务',
      });
    }

    // 状态检查：只有已完成状态可以确认
    if (task.status !== TaskStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: '只有已完成状态的任务可以确认',
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.CONFIRMED },
      include: {
        creator: {
          select: { id: true, name: true, username: true },
        },
        assignee: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    res.json({
      success: true,
      message: '任务已确认完成',
      data: updatedTask,
    });
  } catch (error) {
    console.error('确认任务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

// 验证规则
export const createTaskValidation = [
  body('title').notEmpty().withMessage('任务名称不能为空'),
  body('startTime').notEmpty().isISO8601().withMessage('开始时间格式不正确'),
  body('endTime').notEmpty().isISO8601().withMessage('结束时间格式不正确'),
  body('assigneeId').notEmpty().withMessage('实施人不能为空'),
];

export const updateTaskValidation = [
  param('id').notEmpty().withMessage('任务ID不能为空'),
  body('title').optional().notEmpty().withMessage('任务名称不能为空'),
  body('startTime').optional().isISO8601().withMessage('开始时间格式不正确'),
  body('endTime').optional().isISO8601().withMessage('结束时间格式不正确'),
];

export const getTasksValidation = [
  query('sortBy').optional().isIn(['assigneeId', 'status', 'startTime', 'endTime', 'createdAt']).withMessage('排序字段无效'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('排序方式无效'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
];
