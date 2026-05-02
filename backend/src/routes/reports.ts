import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRoles('ADMIN', 'FRONT_DESK', 'CHANNEL_MANAGER'));

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalRooms = await prisma.room.count();

    const occupiedRooms = await prisma.room.count({
      where: { status: 'OCCUPIED' },
    });

    const vacantRooms = await prisma.room.count({
      where: { status: 'VACANT' },
    });

    const dirtyRooms = await prisma.room.count({
      where: { status: 'DIRTY' },
    });

    const maintenanceRooms = await prisma.room.count({
      where: { status: 'MAINTENANCE' },
    });

    const todayCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayCheckOuts = await prisma.checkIn.count({
      where: {
        actualCheckOutTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const pendingCleaning = await prisma.cleanTask.count({
      where: {
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
      },
    });

    const todayReservations = await prisma.reservation.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayBillItems = await prisma.billItem.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayRevenue = todayBillItems.reduce((sum, item) => {
      return sum + parseFloat(item.amount.toString());
    }, 0);

    const todayPayments = await prisma.payment.findMany({
      where: {
        paymentTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayPaidAmount = todayPayments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount.toString());
    }, 0);

    const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;

    const avgDailyRate = occupiedRooms > 0 ? todayRevenue / occupiedRooms : 0;

    const revpar = totalRooms > 0 ? todayRevenue / totalRooms : 0;

    res.json({
      success: true,
      data: {
        rooms: {
          total: totalRooms,
          occupied: occupiedRooms,
          vacant: vacantRooms,
          dirty: dirtyRooms,
          maintenance: maintenanceRooms,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
        },
        today: {
          checkIns: todayCheckIns,
          checkOuts: todayCheckOuts,
          reservations: todayReservations,
          pendingCleaning,
          revenue: todayRevenue,
          paidAmount: todayPaidAmount,
        },
        performance: {
          avgDailyRate,
          revpar,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/daily', [
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
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

    const { startDate, endDate } = req.query;

    let where: any = {};
    if (startDate && endDate) {
      where.reportDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      where.reportDate = {
        gte: thirtyDaysAgo,
        lte: today,
      };
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
      take: 30,
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Get daily reports error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/revenue', [
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  query('groupBy').optional().isIn(['day', 'month', 'year']).withMessage('分组方式无效'),
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

    const { startDate, endDate, groupBy = 'day' } = req.query;

    let where: any = {};
    if (startDate && endDate) {
      where.transactionTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      where.transactionTime = {
        gte: thirtyDaysAgo,
        lte: today,
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentTime: 'asc' },
    });

    const groupedData: Record<string, any> = {};

    for (const payment of payments) {
      let key: string;
      const date = payment.paymentTime;

      switch (groupBy) {
        case 'year':
          key = date.getFullYear().toString();
          break;
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        default:
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          total: 0,
          count: 0,
          methods: {} as Record<string, number>,
        };
      }

      const amount = parseFloat(payment.amount.toString());
      groupedData[key].total += amount;
      groupedData[key].count += 1;

      if (!groupedData[key].methods[payment.paymentMethod]) {
        groupedData[key].methods[payment.paymentMethod] = 0;
      }
      groupedData[key].methods[payment.paymentMethod] += amount;
    }

    const result = Object.values(groupedData).sort((a: any, b: any) => {
      return a.period.localeCompare(b.period);
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/audit-logs', [
  query('module').optional(),
  query('action').optional(),
  query('operatorId').optional(),
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须为1-100'),
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

    const { module, action, operatorId, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where: any = {};
    if (module) {
      where.module = module;
    }
    if (action) {
      where.action = action;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const total = await prisma.auditLog.count({ where });

    const logs = await prisma.auditLog.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string)),
        },
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
