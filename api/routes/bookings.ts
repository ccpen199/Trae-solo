import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { CreateBookingRequest, BookingOrder, OrderStatus } from '@shared/types';
import { mockBookings, getBookingsByUserId, getBookingById, getBookingsByHotelId, mockHotels, mockRoomTypes, mockRatePlans } from '../../shared/mock/index.js';
import { calculatePricing } from '../utils/pricing.js';

const router = Router();

const createBookingSchema = z.object({
  hotelId: z.string(),
  roomTypeId: z.string(),
  ratePlanId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guestCount: z.object({
    adults: z.number().int().min(1).max(10),
    children: z.number().int().min(0).max(10).optional().default(0),
    infants: z.number().int().min(0).max(10).optional().default(0),
  }),
  guestInfo: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    specialRequests: z.string().optional(),
  })),
  specialRequests: z.string().optional(),
  channelCode: z.string().optional().default('stayglobal'),
  promoCode: z.string().optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createBookingSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const bookingData = validated.data as CreateBookingRequest;
    const { hotelId, roomTypeId, ratePlanId, checkInDate, checkOutDate, guestCount, guestInfo, specialRequests, channelCode, promoCode } = bookingData;

    const hotel = mockHotels.find(h => h.id === hotelId);
    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomType = mockRoomTypes.find(rt => rt.id === roomTypeId && rt.hotelId === hotelId);
    if (!roomType) {
      notFoundResponse(res, 'RoomType');
      return;
    }

    const ratePlan = mockRatePlans.find(rp => rp.id === ratePlanId && rp.roomTypeId === roomTypeId);
    if (!ratePlan) {
      notFoundResponse(res, 'RatePlan');
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const pricing = calculatePricing(
      ratePlan,
      nights,
      guestCount,
      hotel.address.countryCode,
      hotel.address.state,
      undefined,
      promoCode
    );

    const orderNumber = `SG${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(mockBookings.length + 1).padStart(4, '0')}`;
    const confirmationNumber = `SG-${Date.now().toString().slice(-6)}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: BookingOrder = {
      id: `booking-${Date.now()}`,
      orderNumber,
      hotelId,
      hotelName: hotel.name,
      roomTypeId,
      roomTypeName: roomType.name,
      ratePlanId,
      checkInDate,
      checkOutDate,
      nights,
      guestCount: {
        adults: guestCount.adults,
        children: guestCount.children || 0,
        infants: guestCount.infants || 0,
      },
      guestInfo,
      specialRequests,
      pricing,
      status: OrderStatus.PENDING_PAYMENT,
      channelCode,
      paymentStatus: 'unpaid',
      confirmationNumber,
      cancellationDeadline: new Date(checkIn.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockBookings.unshift(newBooking);

    successResponse(res, newBooking, 'Booking created successfully', 201);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { status, page = '1', pageSize = '10' } = req.query;
    
    let bookings = getBookingsByUserId(req.user.id);
    
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedBookings = bookings.slice(startIndex, startIndex + pageSizeNum);

    successResponse(res, {
      items: paginatedBookings,
      total: bookings.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(bookings.length / pageSizeNum),
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:bookingId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { bookingId } = req.params;
    const booking = getBookingById(bookingId);

    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    const userBookings = getBookingsByUserId(req.user.id);
    const hasAccess = userBookings.some(b => b.id === bookingId);

    if (!hasAccess && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have access to this booking', undefined, 403);
      return;
    }

    successResponse(res, booking);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:bookingId/cancel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { bookingId } = req.params;
    const validated = cancelBookingSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const booking = getBookingById(bookingId);
    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    const userBookings = getBookingsByUserId(req.user.id);
    const hasAccess = userBookings.some(b => b.id === bookingId);

    if (!hasAccess && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have access to this booking', undefined, 403);
      return;
    }

    if (booking.status === OrderStatus.CANCELLED) {
      errorResponse(res, 'ALREADY_CANCELLED', 'Booking is already cancelled');
      return;
    }

    if (booking.status === OrderStatus.CHECKED_IN || booking.status === OrderStatus.CHECKED_OUT) {
      errorResponse(res, 'INVALID_STATUS', 'Cannot cancel a booking that has already been checked in or completed');
      return;
    }

    const cancellationDeadline = booking.cancellationDeadline ? new Date(booking.cancellationDeadline) : null;
    const now = new Date();
    const isAfterDeadline = cancellationDeadline && now > cancellationDeadline;

    if (isAfterDeadline && booking.status === OrderStatus.CONFIRMED) {
      errorResponse(res, 'PAST_DEADLINE', 'Cancellation deadline has passed. Please contact customer support.');
      return;
    }

    booking.status = OrderStatus.CANCELLED;
    booking.updatedAt = new Date().toISOString();
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }

    successResponse(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/hotel/:hotelId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    if (req.user.role !== 'HOTEL_ADMIN' && req.user.role !== 'HOTEL_STAFF' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'Insufficient permissions', undefined, 403);
      return;
    }

    const { hotelId } = req.params;
    const { status, page = '1', pageSize = '10' } = req.query;
    
    let bookings = getBookingsByHotelId(hotelId);
    
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedBookings = bookings.slice(startIndex, startIndex + pageSizeNum);

    successResponse(res, {
      items: paginatedBookings,
      total: bookings.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(bookings.length / pageSizeNum),
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:bookingId/pay', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { bookingId } = req.params;
    const booking = getBookingById(bookingId);

    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    const userBookings = getBookingsByUserId(req.user.id);
    const hasAccess = userBookings.some(b => b.id === bookingId);

    if (!hasAccess && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have access to this booking', undefined, 403);
      return;
    }

    if (booking.status !== OrderStatus.PENDING_PAYMENT) {
      errorResponse(res, 'INVALID_STATUS', 'Only pending payment bookings can be paid');
      return;
    }

    booking.status = OrderStatus.CONFIRMED;
    booking.paymentStatus = 'paid';
    booking.updatedAt = new Date().toISOString();

    successResponse(res, booking, 'Payment successful, booking confirmed');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
