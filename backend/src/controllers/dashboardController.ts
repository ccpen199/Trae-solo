import { Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { AccountStatus, OrderStatus, ExceptionStatus, TodoStatus } from '../types/prisma';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const isAdmin = req.user.role === 'ADMIN';
    const isCustomerService = req.user.role === 'CUSTOMER_SERVICE';

    let accountsWhere: any = {};
    let ordersWhere: any = {};
    let exceptionsWhere: any = {};
    let todosWhere: any = {};

    if (!isAdmin && !isCustomerService) {
      accountsWhere.sellerId = req.user.id;
      ordersWhere.OR = [
        { buyerId: req.user.id },
        { sellerId: req.user.id },
      ];
      exceptionsWhere.OR = [
        {
          order: { buyerId: req.user.id },
        },
        {
          order: { sellerId: req.user.id },
        },
      ];
      todosWhere.assigneeId = req.user.id;
    }

    const [
      accounts,
      orders,
      exceptions,
      todos,
      recentOrders,
      recentExceptions,
    ] = await Promise.all([
      prisma.gameAccount.groupBy({
        by: ['status'],
        where: accountsWhere,
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: ordersWhere,
        _count: { id: true },
        _sum: { price: true },
      }),
      prisma.exception.groupBy({
        by: ['status', 'priority'],
        where: exceptionsWhere,
        _count: { id: true },
      }),
      prisma.todo.groupBy({
        by: ['status', 'priority'],
        where: todosWhere,
        _count: { id: true },
      }),
      prisma.order.findMany({
        where: ordersWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          account: {
            select: { title: true, gameName: true },
          },
          buyer: {
            select: { username: true },
          },
          seller: {
            select: { username: true },
          },
        },
      }),
      prisma.exception.findMany({
        where: exceptionsWhere,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10,
        include: {
          order: {
            include: {
              account: {
                select: { title: true },
              },
            },
          },
          handler: {
            select: { username: true },
          },
        },
      }),
    ]);

    const accountStats = accounts.reduce((acc: any, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});

    const orderStats = orders.reduce((acc: any, item) => {
      acc[item.status] = {
        count: item._count.id,
        amount: item._sum.price || 0,
      };
      return acc;
    }, {});

    const exceptionStats = exceptions.reduce((acc: any, item) => {
      if (!acc[item.status]) {
        acc[item.status] = {};
      }
      acc[item.status][item.priority] = item._count.id;
      return acc;
    }, {});

    const todoStats = todos.reduce((acc: any, item) => {
      if (!acc[item.status]) {
        acc[item.status] = {};
      }
      acc[item.status][item.priority] = item._count.id;
      return acc;
    }, {});

    const totalAccounts = accounts.reduce((sum, item) => sum + item._count.id, 0);
    const totalOrders = orders.reduce((sum, item) => sum + item._count.id, 0);
    const totalAmount = orders.reduce((sum, item) => sum + (item._sum.price || 0), 0);
    const pendingExceptions = exceptions
      .filter(e => e.status === 'PENDING' || e.status === 'PROCESSING')
      .reduce((sum, item) => sum + item._count.id, 0);
    const pendingTodos = todos
      .filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
      .reduce((sum, item) => sum + item._count.id, 0);

    const overview = {
      totalAccounts,
      totalOrders,
      totalAmount,
      pendingExceptions,
      pendingTodos,
    };

    successResponse(res, {
      overview,
      accountStats,
      orderStats,
      exceptionStats,
      todoStats,
      recentOrders,
      recentExceptions,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    errorResponse(res, 500, '获取看板数据失败');
  }
};

export const getTrendData = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const isAdmin = req.user.role === 'ADMIN';
    const isCustomerService = req.user.role === 'CUSTOMER_SERVICE';

    let ordersWhere: any = {};

    if (!isAdmin && !isCustomerService) {
      ordersWhere.OR = [
        { buyerId: req.user.id },
        { sellerId: req.user.id },
      ];
    }

    const days = 7;
    const now = new Date();
    const dates: Date[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    const trends = await Promise.all(
      dates.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayWhere = {
          ...ordersWhere,
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        };

        const [dayOrders, dayCompleted] = await Promise.all([
          prisma.order.count({ where: dayWhere }),
          prisma.order.count({
            where: {
              ...dayWhere,
              status: 'COMPLETED',
            },
          }),
        ]);

        return {
          date: date.toISOString().split('T')[0],
          orders: dayOrders,
          completed: dayCompleted,
        };
      })
    );

    successResponse(res, trends);
  } catch (error) {
    console.error('Get trend data error:', error);
    errorResponse(res, 500, '获取趋势数据失败');
  }
};
