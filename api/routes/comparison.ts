import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { SearchParams } from '@shared/types';
import { mockHotels, mockRoomTypes, mockRatePlans, getMockSearchResults } from '../../shared/mock/index.js';

const router = Router();

const comparisonSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adults: z.coerce.number().int().min(1).max(10).optional().default(2),
  children: z.coerce.number().int().min(0).max(10).optional().default(0),
  rooms: z.coerce.number().int().min(1).max(10).optional().default(1),
  hotelIds: z.string().array().optional(),
  sortBy: z.enum(['composite', 'price', 'rating', 'cancellation', 'location']).optional().default('composite'),
});

const WEIGHTS = {
  price: 0.35,
  rating: 0.25,
  cancellation: 0.20,
  location: 0.20,
};

function calculateCompositeScore(
  price: number,
  minPrice: number,
  maxPrice: number,
  rating: number,
  isRefundable: boolean,
  distance?: number
): number {
  const normalizedPrice = maxPrice !== minPrice ? 1 - ((price - minPrice) / (maxPrice - minPrice)) : 1;
  const normalizedRating = rating / 5;
  const cancellationScore = isRefundable ? 1 : 0.3;
  const locationScore = distance !== undefined ? Math.max(0, 1 - distance / 10) : 0.5;

  return (
    normalizedPrice * WEIGHTS.price +
    normalizedRating * WEIGHTS.rating +
    cancellationScore * WEIGHTS.cancellation +
    locationScore * WEIGHTS.location
  );
}

router.get('/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = comparisonSchema.safeParse(req.query);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const params = validated.data as SearchParams & { hotelIds?: string[]; sortBy: string };
    const { destination, hotelIds, sortBy } = params;

    let results = getMockSearchResults(destination);

    if (hotelIds && hotelIds.length > 0) {
      results = results.filter(r => hotelIds.includes(r.hotel.id));
    }

    const allPrices = results.map(r => r.bestRate.price.amount);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    const comparisonResults = results.map(result => {
      const allRatePlans = result.ratePlans;
      const channels = allRatePlans.reduce((acc, rp) => {
        if (!acc[rp.channel]) {
          acc[rp.channel] = [];
        }
        acc[rp.channel].push(rp);
        return acc;
      }, {} as Record<string, typeof allRatePlans>);

      const channelPrices = Object.entries(channels).map(([channel, ratePlans]) => {
        const sorted = [...ratePlans].sort((a, b) => a.price.amount - b.price.amount);
        const best = sorted[0];
        return {
          channel,
          price: best.price,
          originalPrice: best.originalPrice,
          isRefundable: best.isRefundable,
          includesBreakfast: best.includesBreakfast,
          savings: best.originalPrice ? best.originalPrice.amount - best.price.amount : 0,
        };
      }).sort((a, b) => a.price.amount - b.price.amount);

      const bestChannel = channelPrices[0];
      const worstChannel = channelPrices[channelPrices.length - 1];

      const compositeScore = calculateCompositeScore(
        result.bestRate.price.amount,
        minPrice,
        maxPrice,
        result.hotel.overallRating,
        result.bestRate.isRefundable,
        result.distanceFromSearch
      );

      return {
        hotel: result.hotel,
        roomTypes: result.roomTypes,
        bestRate: result.bestRate,
        channelPrices,
        bestChannel: bestChannel?.channel || 'stayglobal',
        bestPrice: bestChannel?.price || result.bestRate.price,
        maxSaving: worstChannel && bestChannel ? worstChannel.price.amount - bestChannel.price.amount : 0,
        compositeScore: Math.round(compositeScore * 100) / 100,
        scoreBreakdown: {
          priceScore: Math.round((maxPrice !== minPrice ? 1 - ((result.bestRate.price.amount - minPrice) / (maxPrice - minPrice)) : 1) * 100),
          ratingScore: Math.round((result.hotel.overallRating / 5) * 100),
          cancellationScore: Math.round((result.bestRate.isRefundable ? 1 : 0.3) * 100),
          locationScore: Math.round((result.distanceFromSearch !== undefined ? Math.max(0, 1 - result.distanceFromSearch / 10) : 0.5) * 100),
        },
        distanceFromSearch: result.distanceFromSearch,
      };
    });

    switch (sortBy) {
      case 'price':
        comparisonResults.sort((a, b) => a.bestPrice.amount - b.bestPrice.amount);
        break;
      case 'rating':
        comparisonResults.sort((a, b) => b.hotel.overallRating - a.hotel.overallRating);
        break;
      case 'cancellation':
        comparisonResults.sort((a, b) => (b.bestRate.isRefundable ? 1 : 0) - (a.bestRate.isRefundable ? 1 : 0));
        break;
      case 'location':
        comparisonResults.sort((a, b) => (a.distanceFromSearch || 0) - (b.distanceFromSearch || 0));
        break;
      case 'composite':
      default:
        comparisonResults.sort((a, b) => b.compositeScore - a.compositeScore);
        break;
    }

    const channels = ['stayglobal', 'booking.com', 'agoda', 'expedia', 'trip.com'];
    const avgPricesByChannel = channels.map(channel => {
      const prices = comparisonResults
        .map(r => r.channelPrices.find(cp => cp.channel === channel)?.price.amount)
        .filter((p): p is number => p !== undefined);
      const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      return {
        channel,
        averagePrice: Math.round(avg * 100) / 100,
        bestPrice: prices.length > 0 ? Math.min(...prices) : 0,
        hotelCount: prices.length,
      };
    });

    successResponse(res, {
      results: comparisonResults,
      channelSummary: avgPricesByChannel,
      totalResults: comparisonResults.length,
      weights: WEIGHTS,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/hotel/:hotelId/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;

    const hotel = mockHotels.find(h => h.id === hotelId);
    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const roomTypes = mockRoomTypes.filter(rt => rt.hotelId === hotelId);
    const allRatePlans = roomTypes.flatMap(rt => mockRatePlans.filter(rp => rp.roomTypeId === rt.id));

    const channels = [...new Set(allRatePlans.map(rp => rp.channel))];

    const channelComparison = channels.map(channel => {
      const channelRates = allRatePlans.filter(rp => rp.channel === channel);
      const prices = channelRates.map(rp => rp.price.amount);
      const originalPrices = channelRates
        .filter(rp => rp.originalPrice)
        .map(rp => rp.originalPrice!.amount);

      return {
        channel,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100,
        minOriginalPrice: originalPrices.length > 0 ? Math.min(...originalPrices) : undefined,
        avgOriginalPrice: originalPrices.length > 0 ? Math.round(originalPrices.reduce((a, b) => a + b, 0) / originalPrices.length * 100) / 100 : undefined,
        rateCount: channelRates.length,
        refundableCount: channelRates.filter(rp => rp.isRefundable).length,
        breakfastCount: channelRates.filter(rp => rp.includesBreakfast).length,
      };
    });

    const stayglobalRates = allRatePlans.filter(rp => rp.channel === 'stayglobal');
    const otherRates = allRatePlans.filter(rp => rp.channel !== 'stayglobal');

    const savingsAnalysis = otherRates.map(rate => {
      const stayglobalEquivalent = stayglobalRates.find(
        sr => sr.roomTypeId === rate.roomTypeId && sr.includesBreakfast === rate.includesBreakfast
      );
      if (!stayglobalEquivalent) return null;

      const priceDiff = rate.price.amount - stayglobalEquivalent.price.amount;
      const percentageDiff = priceDiff > 0 ? Math.round((priceDiff / rate.price.amount) * 100) : 0;

      return {
        roomTypeId: rate.roomTypeId,
        channel: rate.channel,
        competitorPrice: rate.price,
        stayglobalPrice: stayglobalEquivalent.price,
        absoluteSaving: priceDiff > 0 ? priceDiff : 0,
        percentageSaving: percentageDiff,
        isBetterDeal: priceDiff > 0,
      };
    }).filter(Boolean);

    const maxSaving = Math.max(...savingsAnalysis.map(s => s?.percentageSaving || 0), 0);
    const avgSaving = savingsAnalysis.length > 0
      ? Math.round(savingsAnalysis.reduce((a, b) => a + (b?.percentageSaving || 0), 0) / savingsAnalysis.length)
      : 0;

    successResponse(res, {
      hotel,
      channels: channelComparison,
      savingsAnalysis,
      summary: {
        maxSaving,
        avgSaving,
        totalRatePlans: allRatePlans.length,
        channelsCompared: channels.length,
      },
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/channels', async (_req: Request, res: Response): Promise<void> => {
  try {
    const channels = [
      { code: 'stayglobal', name: 'StayGlobal', description: '官方直营渠道，最优价格保障', isDefault: true },
      { code: 'booking.com', name: 'Booking.com', description: '全球最大在线旅游平台' },
      { code: 'agoda', name: 'Agoda', description: '亚太地区领先酒店预订平台' },
      { code: 'expedia', name: 'Expedia', description: '全球综合性旅游服务平台' },
      { code: 'trip.com', name: 'Trip.com', description: '携程旗下国际旅游平台' },
    ];
    successResponse(res, channels);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
