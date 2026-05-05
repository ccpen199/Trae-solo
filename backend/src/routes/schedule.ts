import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { OrderStatus, ScheduleStatus } from '@prisma/client';

const router = Router();

const BATCH_SIZE = parseInt(process.env.SCHEDULE_BATCH_SIZE || '10');
const EXPIRE_MINUTES = parseInt(process.env.SCHEDULE_EXPIRE_MINUTES || '30');
const WARNING_MINUTES = parseInt(process.env.SCHEDULE_WARNING_MINUTES || '25');

router.get(
  '/waiting',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      pageSize = 20,
      orderNo,
      distributionCenterId,
      warehouseId,
      startDate,
      endDate
    } = req.query;

    const where: any = {
      orderStatus: OrderStatus.WAITING_SCHEDULE
    };

    if (orderNo) {
      where.orderNo = { contains: orderNo as string };
    }

    if (distributionCenterId) {
      where.distributionCenterId = distributionCenterId as string;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'asc' }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        orders,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  })
);

router.post(
  '/claim',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        userId,
        status: { in: [ScheduleStatus.PENDING, ScheduleStatus.PROCESSING] }
      }
    });

    if (activeSchedules.length > 0) {
      throw new BadRequestError('You have active schedules. Please complete them before claiming more.');
    }

    await releaseExpiredOrders();

    const availableOrders = await prisma.order.findMany({
      where: {
        orderStatus: OrderStatus.WAITING_SCHEDULE
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE
    });

    if (availableOrders.length === 0) {
      return res.json({
        success: true,
        data: {
          claimed: 0,
          schedules: []
        }
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRE_MINUTES * 60 * 1000);
    const warningAt = new Date(now.getTime() + WARNING_MINUTES * 60 * 1000);

    const schedules = await prisma.$transaction(async (tx) => {
      const createdSchedules = [];

      for (const order of availableOrders) {
        const schedule = await tx.schedule.create({
          data: {
            orderId: order.id,
            userId,
            status: ScheduleStatus.PROCESSING,
            claimedAt: now,
            expiresAt,
            warningAt,
            beforeReceiverName: order.receiverName,
            beforeReceiverPhone: order.receiverPhone,
            beforeReceiverFixedPhone: order.receiverFixedPhone,
            beforeAppointmentCalendar: order.appointmentCalendar
          }
        });

        await tx.order.update({
          where: { id: order.id },
          data: { orderStatus: OrderStatus.SCHEDULING }
        });

        createdSchedules.push(schedule);
      }

      return createdSchedules;
    });

    const schedulesWithOrders = await prisma.schedule.findMany({
      where: {
        id: { in: schedules.map(s => s.id) }
      },
      include: {
        order: true
      }
    });

    res.json({
      success: true,
      data: {
        claimed: schedules.length,
        expiresAt,
        warningAt,
        schedules: schedulesWithOrders
      }
    });
  })
);

router.get(
  '/my',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { status } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status as ScheduleStatus;
    }

    await releaseExpiredOrders();

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        order: true
      },
      orderBy: { claimedAt: 'desc' }
    });

    const activeSchedule = schedules.find(s =>
      s.status === ScheduleStatus.PENDING || s.status === ScheduleStatus.PROCESSING
    );

    res.json({
      success: true,
      data: {
        schedules,
        activeSchedule,
        expireMinutes: EXPIRE_MINUTES,
        warningMinutes: WARNING_MINUTES
      }
    });
  })
);

router.put(
  '/:scheduleId/update',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { scheduleId } = req.params;
    const userId = req.user!.id;
    const {
      receiverName,
      receiverPhone,
      receiverFixedPhone,
      appointmentCalendar
    } = req.body;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { order: true }
    });

    if (!schedule) {
      throw new NotFoundError('Schedule not found');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenError('Not authorized to modify this schedule');
    }

    if (schedule.status !== ScheduleStatus.PROCESSING) {
      throw new BadRequestError('Schedule is not in processing state');
    }

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        afterReceiverName: receiverName,
        afterReceiverPhone: receiverPhone,
        afterReceiverFixedPhone: receiverFixedPhone,
        afterAppointmentCalendar: appointmentCalendar
      }
    });

    const updatedOrder = await prisma.order.update({
      where: { id: schedule.orderId },
      data: {
        receiverName: receiverName !== undefined ? receiverName : schedule.order.receiverName,
        receiverPhone: receiverPhone !== undefined ? receiverPhone : schedule.order.receiverPhone,
        receiverFixedPhone: receiverFixedPhone !== undefined ? receiverFixedPhone : schedule.order.receiverFixedPhone,
        appointmentCalendar: appointmentCalendar !== undefined ? appointmentCalendar : schedule.order.appointmentCalendar
      }
    });

    res.json({
      success: true,
      data: {
        schedule: {
          ...schedule,
          afterReceiverName: receiverName,
          afterReceiverPhone: receiverPhone,
          afterReceiverFixedPhone: receiverFixedPhone,
          afterAppointmentCalendar: appointmentCalendar
        },
        order: updatedOrder
      }
    });
  })
);

router.post(
  '/:scheduleId/confirm',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { scheduleId } = req.params;
    const userId = req.user!.id;
    const { isConfirmed, rejectReason, isMaliciousReject } = req.body;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { order: true }
    });

    if (!schedule) {
      throw new NotFoundError('Schedule not found');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenError('Not authorized to modify this schedule');
    }

    if (schedule.status !== ScheduleStatus.PROCESSING) {
      throw new BadRequestError('Schedule is not in processing state');
    }

    const now = new Date();
    let processingTime = 0;
    if (schedule.claimedAt) {
      processingTime = Math.floor((now.getTime() - schedule.claimedAt.getTime()) / 1000);
    }

    const updatedSchedule = await prisma.$transaction(async (tx) => {
      const newStatus = isConfirmed ? ScheduleStatus.COMPLETED : ScheduleStatus.COMPLETED;

      const updated = await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          status: newStatus,
          isConfirmed,
          confirmTime: now,
          rejectReason,
          isMaliciousReject: isMaliciousReject || false,
          completedAt: now,
          processingTime
        },
        include: { order: true }
      });

      await tx.order.update({
        where: { id: schedule.orderId },
        data: {
          orderStatus: isConfirmed ? OrderStatus.SCHEDULED : OrderStatus.REJECTED
        }
      });

      if (!isConfirmed && isMaliciousReject && schedule.afterReceiverPhone) {
        const phone = schedule.afterReceiverPhone;
        const existing = await tx.riskCustomer.findUnique({
          where: { receiverPhone: phone }
        });

        if (existing) {
          await tx.riskCustomer.update({
            where: { receiverPhone: phone },
            data: {
              rejectCount: existing.rejectCount + 1,
              maliciousRejectCount: existing.maliciousRejectCount + 1,
              lastRejectTime: now,
              isRiskCustomer: existing.maliciousRejectCount + 1 >= 2,
              riskLevel: Math.min(existing.riskLevel + 1, 5)
            }
          });
        } else {
          await tx.riskCustomer.create({
            data: {
              receiverPhone: phone,
              rejectCount: 1,
              maliciousRejectCount: 1,
              lastRejectTime: now,
              isRiskCustomer: false,
              riskLevel: 1
            }
          });
        }
      }

      return updated;
    });

    res.json({
      success: true,
      data: updatedSchedule
    });
  })
);

router.post(
  '/:scheduleId/release',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { scheduleId } = req.params;
    const userId = req.user!.id;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { order: true }
    });

    if (!schedule) {
      throw new NotFoundError('Schedule not found');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenError('Not authorized to modify this schedule');
    }

    if (schedule.status !== ScheduleStatus.PROCESSING) {
      throw new BadRequestError('Schedule is not in processing state');
    }

    const updatedSchedule = await prisma.$transaction(async (tx) => {
      const updated = await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          status: ScheduleStatus.RELEASED,
          releasedAt: new Date()
        }
      });

      await tx.order.update({
        where: { id: schedule.orderId },
        data: {
          orderStatus: OrderStatus.WAITING_SCHEDULE
        }
      });

      return updated;
    });

    res.json({
      success: true,
      data: updatedSchedule
    });
  })
);

router.get(
  '/pending-release',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const now = new Date();

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where: {
          status: { in: [ScheduleStatus.PENDING, ScheduleStatus.PROCESSING] },
          expiresAt: { lte: now }
        },
        include: {
          order: true,
          user: {
            select: { id: true, username: true, name: true }
          }
        },
        skip,
        take: Number(pageSize),
        orderBy: { expiresAt: 'asc' }
      }),
      prisma.schedule.count({
        where: {
          status: { in: [ScheduleStatus.PENDING, ScheduleStatus.PROCESSING] },
          expiresAt: { lte: now }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        schedules,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  })
);

router.post(
  '/batch-release',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { scheduleIds } = req.body;

    if (!scheduleIds || !Array.isArray(scheduleIds)) {
      throw new BadRequestError('Schedule IDs array is required');
    }

    const now = new Date();

    const schedules = await prisma.schedule.findMany({
      where: {
        id: { in: scheduleIds },
        status: { in: [ScheduleStatus.PENDING, ScheduleStatus.PROCESSING] }
      },
      include: { order: true }
    });

    const releasedCount = await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const schedule of schedules) {
        await tx.schedule.update({
          where: { id: schedule.id },
          data: {
            status: ScheduleStatus.RELEASED,
            releasedAt: now
          }
        });

        await tx.order.update({
          where: { id: schedule.orderId },
          data: {
            orderStatus: OrderStatus.WAITING_SCHEDULE
          }
        });

        count++;
      }

      return count;
    });

    res.json({
      success: true,
      data: {
        released: releasedCount,
        total: schedules.length
      }
    });
  })
);

async function releaseExpiredOrders(): Promise<void> {
  const now = new Date();

  const expiredSchedules = await prisma.schedule.findMany({
    where: {
      status: { in: [ScheduleStatus.PENDING, ScheduleStatus.PROCESSING] },
      expiresAt: { lte: now }
    }
  });

  if (expiredSchedules.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const schedule of expiredSchedules) {
      await tx.schedule.update({
        where: { id: schedule.id },
        data: {
          status: ScheduleStatus.EXPIRED,
          releasedAt: now
        }
      });

      await tx.order.update({
        where: { id: schedule.orderId },
        data: {
          orderStatus: OrderStatus.WAITING_SCHEDULE
        }
      });
    }
  });
}

export default router;
