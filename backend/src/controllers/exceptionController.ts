import { Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { ExceptionStatus, ExceptionPriority } from '../types/prisma';

export const getExceptionsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('status').optional(),
  query('type').optional(),
  query('priority').optional(),
  query('handlerId').optional(),
];

export const getExceptions = async (req: AuthRequest, res: Response) => {
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
      handlerId,
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

    if (handlerId) {
      where.handlerId = handlerId;
    }

    if (req.user.role === 'USER') {
      where.OR = [
        {
          order: {
            buyerId: req.user.id,
          },
        },
        {
          order: {
            sellerId: req.user.id,
          },
        },
      ];
    }

    const [total, exceptions] = await Promise.all([
      prisma.exception.count({ where }),
      prisma.exception.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          order: {
            include: {
              account: true,
              buyer: {
                select: {
                  id: true,
                  username: true,
                },
              },
              seller: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          handler: {
            select: {
              id: true,
              username: true,
            },
          },
          logs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / Number(pageSize));

    successResponse(
      res,
      exceptions,
      undefined,
      {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages,
      }
    );
  } catch (error) {
    console.error('Get exceptions error:', error);
    errorResponse(res, 500, '获取异常列表失败');
  }
};

export const getExceptionById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const exception = await prisma.exception.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            account: true,
            buyer: {
              select: {
                id: true,
                username: true,
              },
            },
            seller: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        handler: {
          select: {
            id: true,
            username: true,
          },
        },
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!exception) {
      return errorResponse(res, 404, '异常记录不存在');
    }

    if (req.user.role === 'USER') {
      if (
        exception.order?.buyerId !== req.user.id &&
        exception.order?.sellerId !== req.user.id
      ) {
        return errorResponse(res, 403, '无权查看此异常');
      }
    }

    successResponse(res, exception);
  } catch (error) {
    console.error('Get exception by id error:', error);
    errorResponse(res, 500, '获取异常信息失败');
  }
};

export const assignException = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { handlerId } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'CUSTOMER_SERVICE') {
    return errorResponse(res, 403, '权限不足');
  }

  try {
    const exception = await prisma.exception.findUnique({
      where: { id },
    });

    if (!exception) {
      return errorResponse(res, 404, '异常记录不存在');
    }

    if (exception.status === 'RESOLVED' || exception.status === 'CLOSED') {
      return errorResponse(res, 400, '该异常已处理完成');
    }

    const updatedException = await prisma.$transaction(async (tx) => {
      const newException = await tx.exception.update({
        where: { id },
        data: {
          handlerId: handlerId || req.user.id,
          status: 'PROCESSING' as ExceptionStatus,
        },
        include: {
          handler: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      await tx.exceptionLog.create({
        data: {
          exceptionId: id,
          operatorId: req.user.id,
          action: 'ASSIGN',
          description: `异常已分配给 ${handlerId ? '指定处理人' : '自己'}`,
        },
      });

      return newException;
    });

    successResponse(res, updatedException, '异常已分配');
  } catch (error) {
    console.error('Assign exception error:', error);
    errorResponse(res, 500, '分配异常失败');
  }
};

export const updateExceptionStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, resolution, description } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'CUSTOMER_SERVICE') {
    return errorResponse(res, 403, '权限不足');
  }

  if (!status) {
    return errorResponse(res, 400, '请提供状态');
  }

  try {
    const exception = await prisma.exception.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!exception) {
      return errorResponse(res, 404, '异常记录不存在');
    }

    const updatedException = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: status as ExceptionStatus,
      };

      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
        updateData.resolution = resolution;
      }

      const newException = await tx.exception.update({
        where: { id },
        data: updateData,
        include: {
          handler: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      await tx.exceptionLog.create({
        data: {
          exceptionId: id,
          operatorId: req.user.id,
          action: 'UPDATE_STATUS',
          description: description || `状态更新为 ${status}`,
        },
      });

      if (status === 'RESOLVED' && exception.order) {
        await tx.order.update({
          where: { id: exception.orderId! },
          data: { status: 'COMPLETED' },
        });
      }

      return newException;
    });

    successResponse(res, updatedException, '异常状态已更新');
  } catch (error) {
    console.error('Update exception status error:', error);
    errorResponse(res, 500, '更新异常状态失败');
  }
};

export const addExceptionLog = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action, description } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (!action) {
    return errorResponse(res, 400, '请提供操作类型');
  }

  try {
    const exception = await prisma.exception.findUnique({
      where: { id },
    });

    if (!exception) {
      return errorResponse(res, 404, '异常记录不存在');
    }

    const log = await prisma.exceptionLog.create({
      data: {
        exceptionId: id,
        operatorId: req.user.id,
        action,
        description,
      },
    });

    successResponse(res, log, '日志已添加');
  } catch (error) {
    console.error('Add exception log error:', error);
    errorResponse(res, 500, '添加日志失败');
  }
};

export const getExceptionStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const where: any = {};

    if (req.user.role === 'USER') {
      where.OR = [
        {
          order: {
            buyerId: req.user.id,
          },
        },
        {
          order: {
            sellerId: req.user.id,
          },
        },
      ];
    }

    const [byStatus, byPriority, byType, total] = await Promise.all([
      prisma.exception.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.exception.groupBy({
        by: ['priority'],
        where,
        _count: { id: true },
      }),
      prisma.exception.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
      prisma.exception.count({ where }),
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
    console.error('Get exception stats error:', error);
    errorResponse(res, 500, '获取统计数据失败');
  }
};
