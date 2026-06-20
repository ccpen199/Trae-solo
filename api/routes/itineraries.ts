import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Itinerary, ItineraryVisibility, BookingOrder } from '@shared/types';
import { mockItineraries, mockBookings, getItinerariesByUserId, getItineraryById } from '../../shared/mock/index.js';

const router = Router();

const createItinerarySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional().default('private'),
});

const addBookingSchema = z.object({
  bookingId: z.string(),
  notes: z.string().optional(),
});

const updateItinerarySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const itineraries = getItinerariesByUserId(req.user.id);
    
    const itinerariesWithBookings = itineraries.map(itinerary => {
      const bookings = itinerary.bookingIds
        .map(id => mockBookings.find(b => b.id === id))
        .filter((b): b is BookingOrder => b !== undefined);
      
      const firstBooking = bookings[0];
      const lastBooking = bookings[bookings.length - 1];
      
      return {
        ...itinerary,
        bookings,
        totalBookings: bookings.length,
        startDate: firstBooking?.checkInDate,
        endDate: lastBooking?.checkOutDate,
        totalPrice: bookings.reduce((sum, b) => sum + b.pricing.total.amount, 0),
        currency: firstBooking?.pricing.total.currency,
      };
    });

    successResponse(res, itinerariesWithBookings);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const validated = createItinerarySchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { title, description, visibility } = validated.data;

    const newItinerary: Itinerary = {
      id: `itinerary-${Date.now()}`,
      userId: req.user.id,
      title,
      description,
      bookingIds: [],
      visibility: visibility as ItineraryVisibility,
      shareToken: `share-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockItineraries.unshift(newItinerary);

    successResponse(res, newItinerary, 'Itinerary created successfully', 201);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:itineraryId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { itineraryId } = req.params;
    const itinerary = getItineraryById(itineraryId);

    if (!itinerary) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    const hasAccess = itinerary.userId === req.user.id || 
      itinerary.visibility !== 'private' ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'PLATFORM_OPERATOR';

    if (!hasAccess) {
      errorResponse(res, 'FORBIDDEN', 'You do not have access to this itinerary', undefined, 403);
      return;
    }

    const bookings = itinerary.bookingIds
      .map(id => mockBookings.find(b => b.id === id))
      .filter((b): b is BookingOrder => b !== undefined)
      .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

    const totalPrice = bookings.reduce((sum, b) => sum + b.pricing.total.amount, 0);
    const currency = bookings[0]?.pricing.total.currency;

    successResponse(res, {
      ...itinerary,
      bookings,
      totalPrice,
      currency,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/:itineraryId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { itineraryId } = req.params;
    const itinerary = getItineraryById(itineraryId);

    if (!itinerary) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    if (itinerary.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have permission to edit this itinerary', undefined, 403);
      return;
    }

    const validated = updateItinerarySchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    Object.assign(itinerary, validated.data);
    itinerary.updatedAt = new Date().toISOString();

    successResponse(res, itinerary, 'Itinerary updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.delete('/:itineraryId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { itineraryId } = req.params;
    const index = mockItineraries.findIndex(i => i.id === itineraryId);

    if (index === -1) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    const itinerary = mockItineraries[index];

    if (itinerary.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have permission to delete this itinerary', undefined, 403);
      return;
    }

    mockItineraries.splice(index, 1);

    successResponse(res, null, 'Itinerary deleted successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:itineraryId/bookings', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { itineraryId } = req.params;
    const itinerary = getItineraryById(itineraryId);

    if (!itinerary) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    if (itinerary.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have permission to edit this itinerary', undefined, 403);
      return;
    }

    const validated = addBookingSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { bookingId } = validated.data;
    const booking = mockBookings.find(b => b.id === bookingId);

    if (!booking) {
      notFoundResponse(res, 'Booking');
      return;
    }

    if (!itinerary.bookingIds.includes(bookingId)) {
      itinerary.bookingIds.push(bookingId);
      itinerary.updatedAt = new Date().toISOString();
    }

    const bookings = itinerary.bookingIds
      .map(id => mockBookings.find(b => b.id === id))
      .filter((b): b is BookingOrder => b !== undefined);

    successResponse(res, {
      ...itinerary,
      bookings,
    }, 'Booking added to itinerary successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.delete('/:itineraryId/bookings/:bookingId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { itineraryId, bookingId } = req.params;
    const itinerary = getItineraryById(itineraryId);

    if (!itinerary) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    if (itinerary.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have permission to edit this itinerary', undefined, 403);
      return;
    }

    itinerary.bookingIds = itinerary.bookingIds.filter(id => id !== bookingId);
    itinerary.updatedAt = new Date().toISOString();

    const bookings = itinerary.bookingIds
      .map(id => mockBookings.find(b => b.id === id))
      .filter((b): b is BookingOrder => b !== undefined);

    successResponse(res, {
      ...itinerary,
      bookings,
    }, 'Booking removed from itinerary successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:itineraryId/share', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { itineraryId } = req.params;
    const itinerary = getItineraryById(itineraryId);

    if (!itinerary) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    if (itinerary.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have permission to share this itinerary', undefined, 403);
      return;
    }

    if (!itinerary.shareToken) {
      itinerary.shareToken = `share-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
    itinerary.visibility = 'shared';
    itinerary.updatedAt = new Date().toISOString();

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/itineraries/shared/${itinerary.shareToken}`;

    successResponse(res, {
      ...itinerary,
      shareUrl,
    }, 'Itinerary shared successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/shared/:shareToken', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareToken } = req.params;
    const itinerary = mockItineraries.find(i => i.shareToken === shareToken);

    if (!itinerary) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    if (itinerary.visibility === 'private') {
      errorResponse(res, 'FORBIDDEN', 'This itinerary is private', undefined, 403);
      return;
    }

    const bookings = itinerary.bookingIds
      .map(id => mockBookings.find(b => b.id === id))
      .filter((b): b is BookingOrder => b !== undefined)
      .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

    const totalPrice = bookings.reduce((sum, b) => sum + b.pricing.total.amount, 0);
    const currency = bookings[0]?.pricing.total.currency;

    successResponse(res, {
      ...itinerary,
      bookings,
      totalPrice,
      currency,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:itineraryId/download', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { itineraryId } = req.params;
    const itinerary = getItineraryById(itineraryId);

    if (!itinerary) {
      notFoundResponse(res, 'Itinerary');
      return;
    }

    if (itinerary.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have permission to download this itinerary', undefined, 403);
      return;
    }

    const bookings = itinerary.bookingIds
      .map(id => mockBookings.find(b => b.id === id))
      .filter((b): b is BookingOrder => b !== undefined)
      .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

    const totalPrice = bookings.reduce((sum, b) => sum + b.pricing.total.amount, 0);
    const currency = bookings[0]?.pricing.total.currency;

    const downloadData = {
      itinerary: {
        id: itinerary.id,
        title: itinerary.title,
        description: itinerary.description,
        shareToken: itinerary.shareToken,
      },
      bookings: bookings.map(b => ({
        id: b.id,
        orderNumber: b.orderNumber,
        confirmationNumber: b.confirmationNumber,
        hotelName: b.hotelName,
        roomTypeName: b.roomTypeName,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        nights: b.nights,
        guestCount: b.guestCount,
        guestInfo: b.guestInfo,
        status: b.status,
        total: b.pricing.total,
      })),
      summary: {
        totalBookings: bookings.length,
        totalPrice,
        currency,
        generatedAt: new Date().toISOString(),
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="itinerary-${itineraryId}.json"`);
    res.send(JSON.stringify(downloadData, null, 2));
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
