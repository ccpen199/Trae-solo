import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/enums';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, PermissionDeniedError, ValidationError } from '../errors/AppError';
import orderManagementEngine from '../engines/OrderManagementEngine';
import priceSyncEngine from '../engines/PriceSyncEngine';
import roomCalendarEngine from '../engines/RoomCalendarEngine';
import idempotentService from '../services/IdempotentService';
import permissionService from '../services/PermissionService';
import auditLogService from '../services/AuditLogService';

export interface CreateOrderRequest {
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  specialRequests?: string;
  guestInfo?: Record<string, unknown>;
  requestId: string;
}

export class OrderController {
  createOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const {
      propertyId,
      checkInDate,
      checkOutDate,
      guestCount,
      specialRequests,
      guestInfo,
      requestId,
    } = req.body as CreateOrderRequest;
    
    const userId = req.user.userId;

    if (!requestId) {
      throw new ValidationError('缺少请求ID，用于防止重复提交', { field: 'requestId' });
    }

    const result = await idempotentService.checkOrCreate(
      {
        requestId,
        userId,
        resourceType: 'order',
      },
      async () => {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        const orderResult = await orderManagementEngine.createOrder({
          propertyId,
          guestId: userId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestCount,
          specialRequests,
          guestInfo,
          userId,
        });

        const order = await prisma.order.findUnique({
          where: { id: orderResult.orderId },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                images: true,
              },
            },
          },
        });

        return order;
      }
    );

    if (result.isDuplicate) {
      res.status(200).json({
        status: 'success',
        data: {
          order: result.result,
          isDuplicate: true,
        },
      });
      return;
    }

    res.status(201).json({
      status: 'success',
      data: {
        order: result.result,
      },
    });
  });

  getOrders = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { page = 1, limit = 20, status, propertyId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let where: Record<string, unknown> = {};

    if (userRole === UserRole.LANDLORD) {
      if (propertyId) {
        where.propertyId = propertyId;
      } else {
        where.property = {
          ownerId: userId,
        };
      }
    } else if (userRole === UserRole.GUEST) {
      where.guestId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              images: true,
            },
          },
          guest: {
            select: {
              id: true,
              username: true,
              realName: true,
              phone: true,
            },
          },
          payments: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  });

  getOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkOrderAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    const order = await orderManagementEngine.getOrder(id);

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  });

  confirmOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkOrderAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    if (userRole !== UserRole.LANDLORD && userRole !== UserRole.ADMIN) {
      throw new PermissionDeniedError('只有房东或管理员可以确认订单');
    }

    await orderManagementEngine.confirmOrder(id, userId);

    await auditLogService.logConfirm('Order', id, null, userId);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    logger.info(`Order confirmed: ${id}`, { userId });

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  });

  cancelOrder = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!reason) {
      throw new ValidationError('请提供取消原因', { field: 'reason' });
    }

    const hasAccess = await permissionService.checkOrderAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    await orderManagementEngine.cancelOrder(id, {
      reason,
      userId,
    });

    await auditLogService.logCancel('Order', id, null, userId);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    logger.info(`Order cancelled: ${id}`, { userId, reason });

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  });

  checkIn = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { checkInCode } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkOrderAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    await orderManagementEngine.checkIn(id, {
      checkInCode,
      userId,
    });

    await auditLogService.logConfirm('Order', id, null, userId);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    logger.info(`Check-in completed for order: ${id}`, { userId });

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  });

  checkOut = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkOrderAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    if (userRole !== UserRole.LANDLORD && userRole !== UserRole.ADMIN) {
      throw new PermissionDeniedError('只有房东或管理员可以办理退房');
    }

    await orderManagementEngine.checkOut(id, userId);

    await auditLogService.logComplete('Order', id, null, userId);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    logger.info(`Check-out completed for order: ${id}`, { userId });

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  });

  processRefund = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!amount || amount <= 0) {
      throw new ValidationError('请提供有效的退款金额', { field: 'amount' });
    }

    if (!reason) {
      throw new ValidationError('请提供退款原因', { field: 'reason' });
    }

    const hasAccess = await permissionService.checkOrderAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    if (userRole !== UserRole.LANDLORD && userRole !== UserRole.ADMIN) {
      throw new PermissionDeniedError('只有房东或管理员可以处理退款');
    }

    await orderManagementEngine.processRefund(id, {
      amount,
      reason,
      userId,
    });

    await auditLogService.logRefund('Order', id, null, userId);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    });

    logger.info(`Refund processed for order: ${id}`, { userId, amount, reason });

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  });

  getOrderStatistics = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const stats = await orderManagementEngine.getOrderStatistics(userId, userRole);

    res.status(200).json({
      status: 'success',
      data: {
        statistics: stats,
      },
    });
  });

  calculatePrice = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { propertyId, checkInDate, checkOutDate, guestCount = 1 } = req.query;

    if (!propertyId || !checkInDate || !checkOutDate) {
      throw new ValidationError('请提供房源ID、入住日期和退房日期');
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId as string },
    });

    if (!property) {
      throw new NotFoundError('房源');
    }

    if (!property.isActive) {
      throw new ValidationError('该房源已下架');
    }

    const checkIn = new Date(checkInDate as string);
    const checkOut = new Date(checkOutDate as string);

    const availability = await roomCalendarEngine.checkAvailability(
      propertyId as string,
      checkIn,
      checkOut
    );

    if (!availability.available) {
      res.status(200).json({
        status: 'success',
        data: {
          available: false,
          conflicts: availability.conflicts,
        },
      });
      return;
    }

    const priceResult = await priceSyncEngine.calculatePrice(
      propertyId as string,
      checkIn,
      checkOut,
      parseInt(guestCount as string, 10)
    );

    res.status(200).json({
      status: 'success',
      data: {
        available: true,
        ...priceResult,
        cleaningFee: Number(property.cleaningFee),
        depositAmount: Number(property.depositAmount),
        totalAmount: priceResult.totalPrice + Number(property.cleaningFee) + Number(property.depositAmount),
      },
    });
  });
}

export const orderController = new OrderController();
export default orderController;
