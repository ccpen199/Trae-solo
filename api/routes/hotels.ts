import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { SearchParams, PaginatedResult, Hotel, RoomType, RatePlan } from '@shared/types';
import {
  mockHotels,
  mockRoomTypes,
  mockRatePlans,
  getMockSearchResults,
  getHotelById,
  getRoomTypesByHotelId,
  getRatePlansByRoomTypeId,
} from '../../shared/mock/index.js';
import { calculatePricing, mockTaxRules } from '../utils/pricing.js';

const router = Router();

const searchSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adults: z.coerce.number().int().min(1).max(10).optional().default(2),
  children: z.coerce.number().int().min(0).max(10).optional().default(0),
  infants: z.coerce.number().int().min(0).max(10).optional().default(0),
  rooms: z.coerce.number().int().min(1).max(10).optional().default(1),
  channelCode: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  starRating: z.coerce.number().array().optional(),
  facilities: z.string().array().optional(),
  sortBy: z.enum(['recommended', 'price_low', 'price_high', 'rating', 'distance']).optional().default('recommended'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

const calculatePriceSchema = z.object({
  hotelId: z.string(),
  roomTypeId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  adults: z.coerce.number().int().min(1).max(10).optional().default(2),
  children: z.coerce.number().int().min(0).max(10).optional().default(0),
  infants: z.coerce.number().int().min(0).max(10).optional().default(0),
  promoCode: z.string().optional(),
  channelCode: z.string().optional(),
  memberTier: z.enum(['Bronze', 'Silver', 'Gold']).optional(),
});

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = searchSchema.safeParse(req.query);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const params = validated.data as SearchParams & { page: number; pageSize: number; sortBy: string };
    const { destination, sortBy, page, pageSize } = params;

    let results = getMockSearchResults(destination);

    if (params.minPrice !== undefined) {
      results = results.filter(r => r.bestRate.price.amount >= params.minPrice!);
    }
    if (params.maxPrice !== undefined) {
      results = results.filter(r => r.bestRate.price.amount <= params.maxPrice!);
    }
    if (params.starRating && params.starRating.length > 0) {
      results = results.filter(r => params.starRating!.includes(r.hotel.starRating));
    }
    if (params.facilities && params.facilities.length > 0) {
      results = results.filter(r =>
        params.facilities!.every(f => r.hotel.facilities.includes(f))
      );
    }

    switch (sortBy) {
      case 'price_low':
        results.sort((a, b) => a.bestRate.price.amount - b.bestRate.price.amount);
        break;
      case 'price_high':
        results.sort((a, b) => b.bestRate.price.amount - a.bestRate.price.amount);
        break;
      case 'rating':
        results.sort((a, b) => b.hotel.overallRating - a.hotel.overallRating);
        break;
      case 'distance':
        results.sort((a, b) => (a.distanceFromSearch || 0) - (b.distanceFromSearch || 0));
        break;
      case 'recommended':
      default:
        break;
    }

    const startIndex = (page - 1) * pageSize;
    const paginatedResults = results.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResult<typeof results[0]> = {
      items: paginatedResults,
      total: results.length,
      page,
      pageSize,
      totalPages: Math.ceil(results.length / pageSize),
    };

    successResponse(res, response);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:hotelId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = getHotelById(hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomTypes = getRoomTypesByHotelId(hotelId);
    const ratePlans = roomTypes.flatMap(rt => getRatePlansByRoomTypeId(rt.id));

    successResponse(res, {
      hotel,
      roomTypes,
      ratePlans,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:hotelId/rooms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = getHotelById(hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomTypes = getRoomTypesByHotelId(hotelId);
    const roomsWithRates = roomTypes.map(roomType => ({
      ...roomType,
      ratePlans: getRatePlansByRoomTypeId(roomType.id),
    }));

    successResponse(res, roomsWithRates);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:hotelId/rooms/:roomId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId, roomId } = req.params;
    const hotel = getHotelById(hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomType = mockRoomTypes.find(rt => rt.id === roomId && rt.hotelId === hotelId);
    if (!roomType) {
      notFoundResponse(res, 'RoomType');
      return;
    }

    const ratePlans = getRatePlansByRoomTypeId(roomId);

    successResponse(res, {
      roomType,
      ratePlans,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/calculate-price', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = calculatePriceSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { hotelId, roomTypeId, checkInDate, checkOutDate, adults, children, infants, promoCode, channelCode, memberTier } = validated.data;

    const hotel = getHotelById(hotelId);
    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomType = mockRoomTypes.find(rt => rt.id === roomTypeId && rt.hotelId === hotelId);
    if (!roomType) {
      notFoundResponse(res, 'RoomType');
      return;
    }

    const ratePlans = getRatePlansByRoomTypeId(roomTypeId);
    const stayglobalRate = ratePlans.find(rp => rp.channel === (channelCode || 'stayglobal')) || ratePlans[0];

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const pricing = calculatePricing(
      stayglobalRate,
      nights,
      { adults, children, infants },
      hotel.address.countryCode,
      hotel.address.state,
      memberTier,
      promoCode
    );

    successResponse(res, {
      pricing,
      nights,
      ratePlan: stayglobalRate,
      hotel,
      roomType,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/tax-rules/:countryCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { countryCode } = req.params;
    const rules = mockTaxRules.filter(r => r.countryCode === countryCode.toUpperCase() && r.isActive);
    successResponse(res, rules);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
