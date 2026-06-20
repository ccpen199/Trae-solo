import { Router, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../../utils/response.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../../middleware/auth.js';
import { UserRole, OrderStatus } from '@shared/types';
import { mockBookings, getBookingsByHotelId } from '../../../shared/mock/index.js';

const router = Router();

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']),
  notes: z.string().optional(),
});

const assignRoomSchema = z.object({
  roomNumber: z.string(),
  floor: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, status, page = '1', pageSize = '10' } = req.query;

    if (!hotelId) {
      errorResponse(res, 'MISSING_PARAMETER', 'hotelId is required');
      return;
    }

    let bookings = getBookingsByHotelId(hotelId as string);

    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }

    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedBookings = bookings.slice(startIndex, startIndex + pageSizeNum);

    const summary = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === OrderStatus.PENDING_PAYMENT).length,
      confirmed: bookings.filter(b => b.status === OrderStatus.CONFIRMED).length,
      checkedIn: bookings.filter(b => b.status === OrderStatus.CHECKED_IN).length,
      checkedOut: bookings.filter(b => b.status === OrderStatus.CHECKED_OUT).length,
      cancelled: bookings.filter(b => b.status === OrderStatus.CANCELLED).length,
      todayArrivals: bookings.filter(b => {
        const today = new Date().toISOString().split('T')[0];
        return b.checkInDate === today && b.status === OrderStatus.CONFIRMED;
      }).length,
      todayDepartures: bookings.filter(b => {
        const today = new Date().toISOString().split('T')[0];
        return b.checkOutDate === today && b.status === OrderStatus.CHECKED_IN;
      }).length,
    };

    successResponse(res, {
      items: paginatedBookings,
      total: bookings.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(bookings.length / pageSizeNum),
      summary,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:bookingId', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = mockBookings.find(b => b.id === bookingId);

    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    successResponse(res, {
      ...booking,
      timeline: [
        { status: 'CREATED', timestamp: booking.createdAt, description: '订单创建' },
        { status: 'PAYMENT_COMPLETED', timestamp: booking.createdAt, description: '支付完成' },
        { status: 'CONFIRMED', timestamp: booking.createdAt, description: '酒店确认' },
      ],
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/:bookingId/status', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = mockBookings.find(b => b.id === bookingId);

    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    const validated = updateStatusSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { status, notes } = validated.data;

    const validTransitions: Record<string, string[]> = {
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.CHECKED_IN, OrderStatus.CANCELLED],
      [OrderStatus.CHECKED_IN]: [OrderStatus.CHECKED_OUT, OrderStatus.CANCELLED],
      [OrderStatus.CHECKED_OUT]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[booking.status]?.includes(status as OrderStatus)) {
      errorResponse(res, 'INVALID_TRANSITION', `Cannot transition from ${booking.status} to ${status}`);
      return;
    }

    booking.status = status as OrderStatus;
    booking.updatedAt = new Date().toISOString();

    successResponse(res, {
      booking,
      statusUpdate: {
        oldStatus: booking.status,
        newStatus: status,
        updatedBy: req.user?.email,
        updatedAt: new Date().toISOString(),
        notes,
      },
    }, 'Booking status updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:bookingId/check-in', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = mockBookings.find(b => b.id === bookingId);

    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    if (booking.status !== OrderStatus.CONFIRMED) {
      errorResponse(res, 'INVALID_STATUS', 'Only confirmed bookings can be checked in');
      return;
    }

    const { roomNumber, floor, notes } = req.body;

    booking.status = OrderStatus.CHECKED_IN;
    booking.updatedAt = new Date().toISOString();

    successResponse(res, {
      booking,
      checkInDetails: {
        roomNumber,
        floor,
        checkedInBy: req.user?.email,
        checkedInAt: new Date().toISOString(),
        notes,
      },
    }, 'Check-in successful');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:bookingId/check-out', authMiddleware, roleMiddleware([UserRole.HOTEL_ADMIN, UserRole.HOTEL_STAFF, UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = mockBookings.find(b => b.id === bookingId);

    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    if (booking.status !== OrderStatus.CHECKED_IN) {
      errorResponse(res, 'INVALID_STATUS', 'Only checked-in bookings can be checked out');
      return;
    }

    const { additionalCharges, paymentMethod, notes } = req.body;

    booking.status = OrderStatus.CHECKED_OUT;
    booking.updatedAt = new Date().toISOString();

    successResponse(res, {
      booking,
      checkOutDetails: {
        checkedOutBy: req.user?.email,
        checkedOutAt: new Date().toISOString(),
        additionalCharges: additionalCharges || [],
        paymentMethod,
        notes,
      },
    }, 'Check-out successful');
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

    const bookings = getBookingsByHotelId(hotelId).filter(b => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return checkOut >= start && checkIn <= end;
    });

    const calendarData: Record<string, any[]> = {};
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      calendarData[dateStr] = bookings.filter(b => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        const day = new Date(dateStr);
        return day >= checkIn && day < checkOut;
      }).map(b => ({
        id: b.id,
        orderNumber: b.orderNumber,
        guestName: `${b.guestInfo[0]?.firstName} ${b.guestInfo[0]?.lastName}`,
        roomTypeName: b.roomTypeName,
        status: b.status,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        isArrival: b.checkInDate === dateStr,
        isDeparture: b.checkOutDate === dateStr,
      }));
      current.setDate(current.getDate() + 1);
    }

    successResponse(res, {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      calendarData,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
