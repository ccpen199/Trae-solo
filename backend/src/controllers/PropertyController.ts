import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/enums';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, PermissionDeniedError } from '../errors/AppError';
import roomCalendarEngine from '../engines/RoomCalendarEngine';
import permissionService from '../services/PermissionService';
import auditLogService from '../services/AuditLogService';

export interface CreatePropertyInput {
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  roomCount?: number;
  bedCount?: number;
  bathCount?: number;
  maxGuests?: number;
  pricePerNight: number;
  depositAmount?: number;
  cleaningFee?: number;
  checkInTime?: string;
  checkOutTime?: string;
  amenities?: string[];
  houseRules?: string[];
  images?: string[];
  cancellationPolicy?: string;
}

export class PropertyController {
  createProperty = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const input = req.body as CreatePropertyInput;
    const userId = req.user.userId;

    const property = await prisma.$transaction(async (tx) => {
      const newProperty = await tx.property.create({
        data: {
          name: input.name,
          description: input.description,
          address: input.address,
          latitude: input.latitude ? input.latitude : undefined,
          longitude: input.longitude ? input.longitude : undefined,
          propertyType: input.propertyType,
          roomCount: input.roomCount ?? 1,
          bedCount: input.bedCount ?? 1,
          bathCount: input.bathCount ?? 1,
          maxGuests: input.maxGuests ?? 2,
          pricePerNight: input.pricePerNight,
          depositAmount: input.depositAmount ?? 0,
          cleaningFee: input.cleaningFee ?? 0,
          checkInTime: input.checkInTime ?? '14:00',
          checkOutTime: input.checkOutTime ?? '12:00',
          amenities: input.amenities ?? [],
          houseRules: input.houseRules ?? [],
          images: input.images ?? [],
          cancellationPolicy: input.cancellationPolicy ?? 'flexible',
          ownerId: userId,
        },
      });

      await roomCalendarEngine.initializeCalendar(
        newProperty.id,
        Number(newProperty.pricePerNight),
        { userId }
      );

      return newProperty;
    });

    await auditLogService.logCreate(
      'Property',
      property.id,
      {
        name: property.name,
        address: property.address,
        pricePerNight: Number(property.pricePerNight),
      },
      userId
    );

    logger.info(`Created property: ${property.name}`, {
      userId,
      propertyId: property.id,
    });

    res.status(201).json({
      status: 'success',
      data: {
        property,
      },
    });
  });

  getProperties = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      minPrice, 
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.pricePerNight = {};
      if (minPrice) {
        (where.pricePerNight as Record<string, unknown>).gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        (where.pricePerNight as Record<string, unknown>).lte = parseFloat(maxPrice as string);
      }
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          propertyType: true,
          maxGuests: true,
          pricePerNight: true,
          cleaningFee: true,
          rating: true,
          reviewCount: true,
          images: true,
          isActive: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  });

  getProperty = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        calendars: {
          orderBy: { date: 'asc' },
          take: 365,
        },
        prices: {
          where: { isActive: true },
        },
        channelSyncs: {
          where: { isActive: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundError('房源');
    }

    if (!property.isActive && req.user?.role !== UserRole.ADMIN && req.user?.userId !== property.ownerId) {
      throw new NotFoundError('房源');
    }

    res.status(200).json({
      status: 'success',
      data: {
        property,
      },
    });
  });

  updateProperty = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundError('房源');
    }

    const isOwner = await permissionService.checkPropertyOwner(id, userId, req.user.role);
    if (!isOwner) {
      throw new PermissionDeniedError();
    }

    const previousValue = { ...property };

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        ...req.body,
      },
    });

    await auditLogService.logUpdate(
      'Property',
      id,
      previousValue,
      updatedProperty,
      userId
    );

    logger.info(`Updated property: ${id}`, { userId });

    res.status(200).json({
      status: 'success',
      data: {
        property: updatedProperty,
      },
    });
  });

  deleteProperty = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundError('房源');
    }

    const isOwner = await permissionService.checkPropertyOwner(id, userId, req.user.role);
    if (!isOwner) {
      throw new PermissionDeniedError();
    }

    const activeOrders = await prisma.order.findMany({
      where: {
        propertyId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PAID', 'CHECKED_IN'],
        },
      },
    });

    if (activeOrders.length > 0) {
      res.status(400).json({
        status: 'fail',
        message: '该房源有待处理的订单，无法删除',
        data: {
          activeOrdersCount: activeOrders.length,
        },
      });
      return;
    }

    await prisma.property.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await auditLogService.logDelete(
      'Property',
      id,
      { ...property },
      userId
    );

    logger.info(`Soft deleted property: ${id}`, { userId });

    res.status(200).json({
      status: 'success',
      message: '房源已下架',
    });
  });

  getMyProperties = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: {
          ownerId: userId,
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.property.count({
        where: {
          ownerId: userId,
        },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  });
}

export const propertyController = new PropertyController();
export default propertyController;
