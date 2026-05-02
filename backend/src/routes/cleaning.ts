import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { CleanTaskStatus, RoomStatus, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { roomStatusEngine } from '../engines/roomStatusEngine';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, assigneeId, page = 1, pageSize = 20 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const total = await prisma.cleanTask.count({ where });

    const tasks = await prisma.cleanTask.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        room: true,
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string)),
        },
      },
    });
  } catch (error) {
    console.error('Get clean tasks error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/my-tasks', requireRoles('HOUSEKEEPING'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status } = req.query;

    const where: any = {
      assigneeId: user.id,
    };
    if (status) {
      where.status = status;
    }

    const tasks = await prisma.cleanTask.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        room: true,
      },
    });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const pendingCount = await prisma.cleanTask.count({
      where: { status: CleanTaskStatus.PENDING },
    });

    const assignedCount = await prisma.cleanTask.count({
      where: { status: CleanTaskStatus.ASSIGNED },
    });

    const inProgressCount = await prisma.cleanTask.count({
      where: { status: CleanTaskStatus.IN_PROGRESS },
    });

    const completedCount = await prisma.cleanTask.count({
      where: { status: CleanTaskStatus.COMPLETED },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCompleted = await prisma.cleanTask.count({
      where: {
        status: CleanTaskStatus.COMPLETED,
        completeTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        assigned: assignedCount,
        inProgress: inProgressCount,
        completed: completedCount,
        todayCompleted,
      },
    });
  } catch (error) {
    console.error('Get cleaning stats error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.cleanTask.findUnique({
      where: { id },
      include: {
        room: true,
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '清洁任务不存在',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get clean task error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', requireRoles('ADMIN', 'FRONT_DESK'), [
  body('roomId').notEmpty().withMessage('房间ID不能为空'),
  body('taskType').notEmpty().withMessage('任务类型不能为空'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('优先级必须为1-5'),
  body('remark').optional(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    const { roomId, taskType, priority, remark } = req.body;
    const user = req.user!;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在',
      });
    }

    const existingTask = await prisma.cleanTask.findFirst({
      where: {
        roomId,
        status: { in: [CleanTaskStatus.PENDING, CleanTaskStatus.ASSIGNED, CleanTaskStatus.IN_PROGRESS] },
      },
    });

    if (existingTask) {
      return res.status(400).json({
        success: false,
        message: '该房间已有未完成的清洁任务',
      });
    }

    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const count = await prisma.cleanTask.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    const taskNo = `CT${dateStr}${(count + 1).toString().padStart(6, '0')}`;

    const task = await prisma.cleanTask.create({
      data: {
        taskNo,
        roomId,
        taskType,
        priority: priority || 1,
        remark,
      },
      include: {
        room: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_CLEAN_TASK',
        module: 'Cleaning',
        targetType: 'CleanTask',
        targetId: task.id,
        operatorId: user.id,
        operatorName: user.name,
        newValue: JSON.parse(JSON.stringify(task)),
      },
    });

    res.status(201).json({
      success: true,
      data: task,
      message: '清洁任务创建成功',
    });
  } catch (error) {
    console.error('Create clean task error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id/assign', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('任务ID不能为空'),
  body('assigneeId').notEmpty().withMessage('分配人ID不能为空'),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { assigneeId } = req.body;
    const user = req.user!;

    const task = await prisma.cleanTask.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '清洁任务不存在',
      });
    }

    if (task.status !== CleanTaskStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: '只能分配待处理的任务',
      });
    }

    const assignee = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        role: UserRole.HOUSEKEEPING,
        isActive: true,
      },
    });

    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: '房务人员不存在或已禁用',
      });
    }

    const updatedTask = await prisma.cleanTask.update({
      where: { id },
      data: {
        assigneeId,
        status: CleanTaskStatus.ASSIGNED,
      },
      include: {
        room: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ASSIGN_CLEAN_TASK',
        module: 'Cleaning',
        targetType: 'CleanTask',
        targetId: id,
        operatorId: user.id,
        operatorName: user.name,
        newValue: JSON.parse(JSON.stringify(updatedTask)),
      },
    });

    res.json({
      success: true,
      data: updatedTask,
      message: '任务分配成功',
    });
  } catch (error) {
    console.error('Assign clean task error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id/start', requireRoles('HOUSEKEEPING'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await prisma.cleanTask.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '清洁任务不存在',
      });
    }

    if (task.assigneeId !== user.id) {
      return res.status(403).json({
        success: false,
        message: '只能开始分配给自己的任务',
      });
    }

    if (task.status !== CleanTaskStatus.ASSIGNED) {
      return res.status(400).json({
        success: false,
        message: '只能开始已分配的任务',
      });
    }

    const updatedTask = await prisma.cleanTask.update({
      where: { id },
      data: {
        status: CleanTaskStatus.IN_PROGRESS,
        startTime: new Date(),
      },
      include: {
        room: true,
      },
    });

    res.json({
      success: true,
      data: updatedTask,
      message: '任务已开始',
    });
  } catch (error) {
    console.error('Start clean task error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id/complete', requireRoles('HOUSEKEEPING'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { remark } = req.body;

    const task = await prisma.cleanTask.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '清洁任务不存在',
      });
    }

    if (task.assigneeId !== user.id) {
      return res.status(403).json({
        success: false,
        message: '只能完成分配给自己的任务',
      });
    }

    if (task.status !== CleanTaskStatus.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        message: '只能完成进行中的任务',
      });
    }

    const updatedTask = await prisma.cleanTask.update({
      where: { id },
      data: {
        status: CleanTaskStatus.COMPLETED,
        completeTime: new Date(),
        remark: remark || task.remark,
      },
      include: {
        room: true,
      },
    });

    const statusResult = await roomStatusEngine.changeStatus({
      roomId: task.roomId,
      newStatus: RoomStatus.VACANT,
      operatorId: user.id,
      operatorName: user.name,
      reason: '清洁完成',
      referenceType: 'CleanTask',
      referenceId: id,
    });

    if (!statusResult.success) {
      return res.status(400).json({
        success: false,
        message: statusResult.error,
      });
    }

    res.json({
      success: true,
      data: updatedTask,
      message: '任务完成，房间已更新为干净房',
    });
  } catch (error) {
    console.error('Complete clean task error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id/cancel', requireRoles('ADMIN', 'FRONT_DESK'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { reason } = req.body;

    const task = await prisma.cleanTask.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '清洁任务不存在',
      });
    }

    if (task.status === CleanTaskStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: '已完成的任务不能取消',
      });
    }

    const updatedTask = await prisma.cleanTask.update({
      where: { id },
      data: {
        status: CleanTaskStatus.CANCELLED,
        remark: reason || task.remark,
      },
      include: {
        room: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CANCEL_CLEAN_TASK',
        module: 'Cleaning',
        targetType: 'CleanTask',
        targetId: id,
        operatorId: user.id,
        operatorName: user.name,
        newValue: JSON.parse(JSON.stringify(updatedTask)),
      },
    });

    res.json({
      success: true,
      data: updatedTask,
      message: '任务已取消',
    });
  } catch (error) {
    console.error('Cancel clean task error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
