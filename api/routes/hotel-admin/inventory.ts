import { Router, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../../utils/response.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../../middleware/auth.js';
import { UserRole } from '@shared/types';
import { mockHotels, mockRoomTypes, mockRatePlans } from '../../../shared/mock/index.js';

const router = Router();

const updateRoomTypeSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  maxOccupancy: z.number().int().min(1).optional(),
  basePrice: z.number().min(0).optional(),
  size: z.number().min(0).optional(),
  bedType: z.string().optional(),
  amenities: z.string().array().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT']).optional(),
});

const updateRatePlanSchema = z.object({
  name: z.string().optional(),
  channel: z.string().optional(),
  price: z.object({
    amount: z.number().min(0),
    currency: z.string(),
  }).optional(),
  originalPrice: z.object({
    amount: z.number().min(0),
    currency: z.string(),
  }).optional(),
  includesBreakfast: z.boolean().optional(),
  isRefundable: z.boolean().optional(),
  cancellationPolicy: z.object({
    freeCancellationDays: z.number().int().min(0),
    penaltyPercentage: z.number().min(0).max(100),
  }).optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  minStay: z.number().int().min(1).optional(),
  maxStay: z.number().int().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT']).optional(),
});

const updateInventorySchema = z.object({
  date: z.string(),
  available: z.number().int().min(0),
  booked: z.number().int().min(0).optional(),
  price: z.object({
    amount: z.number().min(0),
    currency: z.string(),
  }).optional(),
  minStay: z.number().int().min(1).optional(),
  closeOut: z.boolean().optional(),
  stopSell: z.boolean().optional(),
});

const bulkUpdateSchema = z.object({
  roomTypeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  updates: z.object({
    available: z.number().int().min(0).optional(),
    price: z.object({
      amount: z.number().min(0),
      currency: z.string(),
    }).optional(),
    closeOut: z.boolean().optional(),
    stopSell: z.boolean().optional(),
  }),
});

router.get('/rooms/:hotelId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomTypes = mockRoomTypes
      .filter(rt => rt.hotelId === hotelId)
      .map(rt => ({
        ...rt,
        ratePlans: mockRatePlans.filter(rp => rp.roomTypeId === rt.id),
        inventory: generateInventoryCalendar(rt.id),
      }));

    successResponse(res, {
      hotel,
      roomTypes,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/rooms/:hotelId/:roomTypeId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, roomTypeId } = req.params;
    const roomType = mockRoomTypes.find(rt => rt.id === roomTypeId && rt.hotelId === hotelId);

    if (!roomType) {
      notFoundResponse(res, 'RoomType');
      return;
    }

    const ratePlans = mockRatePlans.filter(rp => rp.roomTypeId === roomTypeId);
    const inventory = generateInventoryCalendar(roomTypeId);

    successResponse(res, {
      roomType,
      ratePlans,
      inventory,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/rooms/:hotelId/:roomTypeId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, roomTypeId } = req.params;
    const roomType = mockRoomTypes.find(rt => rt.id === roomTypeId && rt.hotelId === hotelId);

    if (!roomType) {
      notFoundResponse(res, 'RoomType');
      return;
    }

    const validated = updateRoomTypeSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    Object.assign(roomType, validated.data, { updatedAt: new Date().toISOString() });

    successResponse(res, roomType, 'Room type updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/rate-plans/:hotelId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);
    const ratePlans = mockRatePlans
      .filter(rp => roomTypes.some(rt => rt.id === rp.roomTypeId))
      .map(rp => ({
        ...rp,
        roomTypeName: roomTypes.find(rt => rt.id === rp.roomTypeId)?.name,
      }));

    successResponse(res, {
      hotel,
      ratePlans,
      channels: ['stayglobal', 'booking.com', 'agoda', 'expedia', 'trip.com'],
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/rate-plans/:ratePlanId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ratePlanId } = req.params;
    const ratePlan = mockRatePlans.find(rp => rp.id === ratePlanId);

    if (!ratePlan) {
      notFoundResponse(res, 'RatePlan');
      return;
    }

    const validated = updateRatePlanSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    Object.assign(ratePlan, validated.data, { updatedAt: new Date().toISOString() });

    successResponse(res, ratePlan, 'Rate plan updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/calendar/:hotelId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

    const roomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);
    const calendarData: Record<string, any> = {};

    roomTypes.forEach(roomType => {
      const inventory = generateInventoryCalendar(roomType.id, start, end);
      calendarData[roomType.id] = {
        roomType,
        inventory,
      };
    });

    successResponse(res, {
      hotelId,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      calendarData,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/inventory/:hotelId/:roomTypeId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, roomTypeId } = req.params;
    const roomType = mockRoomTypes.find(rt => rt.id === roomTypeId && rt.hotelId === hotelId);

    if (!roomType) {
      notFoundResponse(res, 'RoomType');
      return;
    }

    const validated = updateInventorySchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    successResponse(res, {
      roomTypeId,
      ...validated.data,
      updatedAt: new Date().toISOString(),
    }, 'Inventory updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/inventory/bulk', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = bulkUpdateSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { roomTypeId, startDate, endDate, updates } = validated.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    successResponse(res, {
      roomTypeId,
      startDate,
      endDate,
      daysUpdated: days,
      updates,
      updatedAt: new Date().toISOString(),
    }, 'Bulk inventory update successful');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/dashboard/:hotelId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);
    const totalRooms = roomTypes.reduce((sum, rt) => sum + (rt.totalInventory || 0), 0);

    const dashboardData = {
      hotel,
      occupancy: {
        today: 75,
        tomorrow: 82,
        thisWeek: 78,
        thisMonth: 72,
      },
      revenue: {
        today: 12500,
        yesterday: 15800,
        thisWeek: 89500,
        thisMonth: 356000,
        lastMonth: 328000,
      },
      adr: {
        today: 1250,
        thisWeek: 1180,
        thisMonth: 1150,
        lastMonth: 1120,
      },
      revpar: {
        today: 937.5,
        thisWeek: 920.4,
        thisMonth: 828,
        lastMonth: 806.4,
      },
      inventory: {
        totalRooms,
        availableToday: Math.round(totalRooms * 0.25),
        bookedToday: Math.round(totalRooms * 0.75),
        outOfOrder: 2,
      },
      channels: [
        { channel: 'stayglobal', bookings: 45, revenue: 125000 },
        { channel: 'booking.com', bookings: 28, revenue: 89000 },
        { channel: 'trip.com', bookings: 18, revenue: 62000 },
        { channel: 'agoda', bookings: 12, revenue: 45000 },
        { channel: 'expedia', bookings: 8, revenue: 35000 },
      ],
      upcomingArrivals: 12,
      upcomingDepartures: 8,
    };

    successResponse(res, dashboardData);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

function generateInventoryCalendar(roomTypeId: string, start?: Date, end?: Date) {
  const startDate = start || new Date();
  const endDate = end || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const calendar: any[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const available = Math.floor(Math.random() * 10) + 1;
    const booked = Math.floor(Math.random() * 15);
    calendar.push({
      date: current.toISOString().split('T')[0],
      dayOfWeek: current.getDay(),
      available,
      booked,
      total: available + booked,
      price: {
        amount: Math.floor(Math.random() * 500) + 100,
        currency: 'USD',
      },
      minStay: 1,
      closeOut: false,
      stopSell: false,
    });
    current.setDate(current.getDate() + 1);
  }

  return calendar;
}

export default router;
