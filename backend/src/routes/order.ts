import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { OrderStatus, OrderType } from '@prisma/client';

const router = Router();

export function checkOrderEligibility(order: any): { eligible: boolean; reason?: string } {
  if (order.isSelfPickup) {
    return { eligible: false, reason: '自提订单不进入调度系统' };
  }

  if (order.isSameDayDelivery) {
    return { eligible: false, reason: '当日时效订单不进入调度系统' };
  }

  if (!order.hasTimingCalculated) {
    return { eligible: false, reason: '时效未算出订单不进入调度系统' };
  }

  if (!order.appointmentConsistent) {
    return { eligible: false, reason: '预约日历不一致订单不进入调度系统' };
  }

  if (order.orderType === OrderType.SELF_PICKUP) {
    return { eligible: false, reason: '自提订单类型不进入调度系统' };
  }

  if (order.orderType === OrderType.SMALL_MEDIUM || order.orderType === OrderType.BULK) {
    return { eligible: true };
  }

  return { eligible: false, reason: '订单类型不符合要求' };
}

router.post(
  '/entry-check',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNo } = req.body;

    if (!orderNo) {
      throw new BadRequestError('Order number is required');
    }

    let order = await prisma.order.findUnique({
      where: { orderNo }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const checkResult = checkOrderEligibility(order);

    const updateData: any = {
      entryCheckTime: new Date(),
      entryCheckResult: checkResult.reason || 'eligible'
    };

    if (checkResult.eligible) {
      updateData.orderStatus = OrderStatus.WAITING_SCHEDULE;
    } else {
      updateData.orderStatus = OrderStatus.ENTRY_REJECTED;
    }

    order = await prisma.order.update({
      where: { orderNo },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        orderNo: order.orderNo,
        eligible: checkResult.eligible,
        reason: checkResult.reason,
        orderStatus: order.orderStatus
      }
    });
  })
);

router.post(
  '/batch-entry-check',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNos } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      throw new BadRequestError('Order numbers array is required');
    }

    const orders = await prisma.order.findMany({
      where: { orderNo: { in: orderNos } }
    });

    const results = [];
    const updatePromises = [];

    for (const order of orders) {
      const checkResult = checkOrderEligibility(order);

      const updateData: any = {
        entryCheckTime: new Date(),
        entryCheckResult: checkResult.reason || 'eligible'
      };

      if (checkResult.eligible) {
        updateData.orderStatus = OrderStatus.WAITING_SCHEDULE;
      } else {
        updateData.orderStatus = OrderStatus.ENTRY_REJECTED;
      }

      updatePromises.push(
        prisma.order.update({
          where: { orderNo: order.orderNo },
          data: updateData
        })
      );

      results.push({
        orderNo: order.orderNo,
        eligible: checkResult.eligible,
        reason: checkResult.reason
      });
    }

    await Promise.all(updatePromises);

    const eligibleCount = results.filter(r => r.eligible).length;
    const rejectedCount = results.length - eligibleCount;

    res.json({
      success: true,
      data: {
        total: results.length,
        eligible: eligibleCount,
        rejected: rejectedCount,
        results
      }
    });
  })
);

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      pageSize = 20,
      orderNo,
      orderStatus,
      orderType,
      distributionCenterId,
      warehouseId,
      startDate,
      endDate
    } = req.query;

    const where: any = {};

    if (orderNo) {
      where.orderNo = { contains: orderNo as string };
    }

    if (orderStatus) {
      where.orderStatus = orderStatus as OrderStatus;
    }

    if (orderType) {
      where.orderType = orderType as OrderType;
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
        orderBy: { createdAt: 'desc' }
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

router.get(
  '/:orderNo',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNo } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        schedules: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    res.json({
      success: true,
      data: order
    });
  })
);

router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      orderNo,
      orderType,
      distributionCenterId,
      warehouseId,
      pieceCount,
      volume,
      weight,
      receiverName,
      receiverPhone,
      receiverFixedPhone,
      appointmentCalendar,
      isSelfPickup,
      isSameDayDelivery,
      hasTimingCalculated,
      appointmentConsistent
    } = req.body;

    if (!orderNo || !orderType) {
      throw new BadRequestError('Order number and type are required');
    }

    const existingOrder = await prisma.order.findUnique({
      where: { orderNo }
    });

    if (existingOrder) {
      throw new BadRequestError('Order number already exists');
    }

    const order = await prisma.order.create({
      data: {
        orderNo,
        orderType,
        orderStatus: OrderStatus.PENDING_ENTRY,
        distributionCenterId,
        warehouseId,
        pieceCount: pieceCount || 0,
        volume: volume || 0,
        weight: weight || 0,
        receiverName,
        receiverPhone,
        receiverFixedPhone,
        appointmentCalendar,
        isSelfPickup: isSelfPickup || false,
        isSameDayDelivery: isSameDayDelivery || false,
        hasTimingCalculated: hasTimingCalculated !== false,
        appointmentConsistent: appointmentConsistent !== false
      }
    });

    res.json({
      success: true,
      data: order
    });
  })
);

router.put(
  '/:orderNo',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderNo } = req.params;
    const {
      receiverName,
      receiverPhone,
      receiverFixedPhone,
      appointmentCalendar
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        schedules: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const hasActiveSchedule = order.schedules?.some(
      (s: any) => s.status === 'PROCESSING' || s.status === 'PENDING'
    );
    if (hasActiveSchedule) {
      throw new BadRequestError('Scheduled order cannot be modified from frontend');
    }

    const updatedOrder = await prisma.order.update({
      where: { orderNo },
      data: {
        receiverName,
        receiverPhone,
        receiverFixedPhone,
        appointmentCalendar
      }
    });

    res.json({
      success: true,
      data: updatedOrder
    });
  })
);

export default router;
