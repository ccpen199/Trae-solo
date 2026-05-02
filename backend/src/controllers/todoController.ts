import { Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { TodoStatus, TodoPriority } from '../types/prisma';

export const getTodosValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('status').optional(),
  query('type').optional(),
  query('priority').optional(),
  query('assigneeId').optional(),
];

export const createTodoValidation = [
  body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 200 }),
  body('type').notEmpty().withMessage('类型不能为空'),
];

export const getTodos = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      type,
      priority,
      assigneeId,
    } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (req.user.role === 'USER') {
      where.assigneeId = req.user.id;
    }

    const [total, todos] = await Promise.all([
      prisma.todo.count({ where }),
      prisma.todo.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
    ]);

    const totalPages = Math.ceil(total / Number(pageSize));

    successResponse(
      res,
      todos,
      undefined,
      {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages,
      }
    );
  } catch (error) {
    console.error('Get todos error:', error);
    errorResponse(res, 500, '获取待办列表失败');
  }
};

export const getTodoById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      return errorResponse(res, 404, '待办事项不存在');
    }

    if (
      req.user.role === 'USER' &&
      todo.assigneeId &&
      todo.assigneeId !== req.user.id
    ) {
      return errorResponse(res, 403, '无权查看此待办');
    }

    successResponse(res, todo);
  } catch (error) {
    console.error('Get todo by id error:', error);
    errorResponse(res, 500, '获取待办信息失败');
  }
};

export const createTodo = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (req.user.role === 'USER') {
    return errorResponse(res, 403, '权限不足');
  }

  try {
    const {
      title,
      description,
      type,
      priority,
      relatedId,
      relatedType,
      assigneeId,
      dueAt,
    } = req.body;

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        type,
        priority: priority || 'MEDIUM',
        relatedId,
        relatedType,
        assigneeId,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        status: 'PENDING' as TodoStatus,
      },
    });

    successResponse(res, todo, '待办已创建');
  } catch (error) {
    console.error('Create todo error:', error);
    errorResponse(res, 500, '创建待办失败');
  }
};

export const updateTodo = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      return errorResponse(res, 404, '待办事项不存在');
    }

    if (
      req.user.role === 'USER' &&
      todo.assigneeId &&
      todo.assigneeId !== req.user.id
    ) {
      return errorResponse(res, 403, '无权操作此待办');
    }

    const {
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      dueAt,
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null;

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: updateData,
    });

    successResponse(res, updatedTodo, '待办已更新');
  } catch (error) {
    console.error('Update todo error:', error);
    errorResponse(res, 500, '更新待办失败');
  }
};

export const deleteTodo = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (req.user.role === 'USER') {
    return errorResponse(res, 403, '权限不足');
  }

  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      return errorResponse(res, 404, '待办事项不存在');
    }

    await prisma.todo.delete({
      where: { id },
    });

    successResponse(res, null, '待办已删除');
  } catch (error) {
    console.error('Delete todo error:', error);
    errorResponse(res, 500, '删除待办失败');
  }
};

export const getTodoStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const where: any = {};

    if (req.user.role === 'USER') {
      where.assigneeId = req.user.id;
    }

    const [byStatus, byPriority, byType, total] = await Promise.all([
      prisma.todo.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.todo.groupBy({
        by: ['priority'],
        where,
        _count: { id: true },
      }),
      prisma.todo.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
      prisma.todo.count({ where }),
    ]);

    const stats = {
      total,
      byStatus: byStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc: any, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {}),
      byType: byType.reduce((acc: any, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {}),
    };

    successResponse(res, stats);
  } catch (error) {
    console.error('Get todo stats error:', error);
    errorResponse(res, 500, '获取统计数据失败');
  }
};
