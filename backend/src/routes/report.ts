import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { Prisma } from '@prisma/client';

const router = Router();

router.get(
  '/statistics',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate, distributionCenterId, warehouseId } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const totalOrders = await prisma.order.count({ where });
    const waitingOrders = await prisma.order.count({
      where: { ...where, orderStatus: 'WAITING_SCHEDULE' }
    });
    const scheduledOrders = await prisma.order.count({
      where: { ...where, orderStatus: 'SCHEDULED' }
    });
    const completedOrders = await prisma.order.count({
      where: { ...where, orderStatus: 'COMPLETED' }
    });
    const rejectedOrders = await prisma.order.count({
      where: { ...where, orderStatus: 'REJECTED' }
    });

    const activeSchedules = await prisma.schedule.count({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    const scheduleWhere: any = {
      status: 'COMPLETED'
    };

    if (startDate || endDate) {
      scheduleWhere.completedAt = {};
      if (startDate) {
        scheduleWhere.completedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        scheduleWhere.completedAt.lte = new Date(endDate as string);
      }
    }

    const completedSchedules = await prisma.schedule.findMany({
      where: scheduleWhere,
      select: { processingTime: true }
    });

    const validTimes = completedSchedules
      .map(s => s.processingTime)
      .filter(t => t !== null) as number[];

    const avgProcessingTime = validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
      : 0;

    const maliciousRejects = await prisma.schedule.count({
      where: {
        ...scheduleWhere,
        isMaliciousReject: true
      }
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        waitingOrders,
        scheduledOrders,
        completedOrders,
        rejectedOrders,
        activeSchedules,
        avgProcessingTime: Math.round(avgProcessingTime),
        maliciousRejects
      }
    });
  })
);

router.get(
  '/user-efficiency',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const scheduleWhere: any = {
      status: 'COMPLETED'
    };

    if (startDate || endDate) {
      scheduleWhere.completedAt = {};
      if (startDate) {
        scheduleWhere.completedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        scheduleWhere.completedAt.lte = new Date(endDate as string);
      }
    }

    const userStats = await prisma.user.findMany({
      skip,
      take: Number(pageSize),
      include: {
        schedules: {
          where: scheduleWhere,
          select: {
            id: true,
            processingTime: true,
            isMaliciousReject: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const totalUsers = await prisma.user.count();

    const statistics = userStats.map(user => {
      const schedules = user.schedules;
      const totalCompleted = schedules.length;

      const validTimes = schedules
        .map(s => s.processingTime)
        .filter(t => t !== null) as number[];

      const avgTime = validTimes.length > 0
        ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
        : 0;

      const maliciousCount = schedules.filter(s => s.isMaliciousReject).length;

      return {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        totalCompleted,
        avgProcessingTime: Math.round(avgTime),
        maliciousRejects: maliciousCount
      };
    });

    res.json({
      success: true,
      data: {
        statistics,
        total: totalUsers,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  })
);

router.get(
  '/daily',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate, page = 1, pageSize = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.reportDate.lte = new Date(endDate as string);
      }
    }

    const [reports, total] = await Promise.all([
      prisma.scheduleReport.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { reportDate: 'desc' }
      }),
      prisma.scheduleReport.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        reports,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  })
);

router.get(
  '/risk-customers',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, pageSize = 20, isRiskCustomer } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};

    if (isRiskCustomer !== undefined) {
      where.isRiskCustomer = isRiskCustomer === 'true';
    }

    const [customers, total] = await Promise.all([
      prisma.riskCustomer.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { maliciousRejectCount: 'desc' }
      }),
      prisma.riskCustomer.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        customers,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  })
);

router.post(
  '/generate-daily-report',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { date } = req.body;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(reportDate);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const totalOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const schedules = await prisma.schedule.findMany({
      where: {
        completedAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'COMPLETED'
      },
      select: {
        processingTime: true,
        isMaliciousReject: true,
        isConfirmed: true
      }
    });

    const scheduledOrders = schedules.length;
    const completedOrders = schedules.filter(s => s.isConfirmed).length;
    const expiredOrders = schedules.filter(s => !s.isConfirmed).length;

    const validTimes = schedules
      .map(s => s.processingTime)
      .filter(t => t !== null) as number[];

    const avgProcessingTime = validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
      : 0;

    const maliciousRejects = schedules.filter(s => s.isMaliciousReject).length;

    const existingReport = await prisma.scheduleReport.findFirst({
      where: {
        reportDate,
        distributionCenterId: null,
        warehouseId: null
      }
    });

    let report;
    if (existingReport) {
      report = await prisma.scheduleReport.update({
        where: { id: existingReport.id },
        data: {
          totalOrders,
          scheduledOrders,
          completedOrders,
          expiredOrders,
          avgProcessingTime: Math.round(avgProcessingTime),
          maliciousRejects
        }
      });
    } else {
      report = await prisma.scheduleReport.create({
        data: {
          reportDate,
          totalOrders,
          scheduledOrders,
          completedOrders,
          expiredOrders,
          avgProcessingTime: Math.round(avgProcessingTime),
          maliciousRejects
        }
      });
    }

    res.json({
      success: true,
      data: report
    });
  })
);

router.get(
  '/export-risk-customers',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const customers = await prisma.riskCustomer.findMany({
      where: { isRiskCustomer: true },
      orderBy: { riskLevel: 'desc' }
    });

    const exportData = customers.map(c => ({
      receiverPhone: c.receiverPhone,
      rejectCount: c.rejectCount,
      maliciousRejectCount: c.maliciousRejectCount,
      riskLevel: c.riskLevel,
      lastRejectTime: c.lastRejectTime,
      isRiskCustomer: c.isRiskCustomer
    }));

    res.json({
      success: true,
      data: {
        exportCount: exportData.length,
        customers: exportData,
        exportedAt: new Date().toISOString()
      }
    });
  })
);

export default router;
