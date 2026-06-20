import { Router, Response } from 'express';
import { z } from 'zod';
import { successResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../../utils/response.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../../middleware/auth.js';
import { UserRole } from '@shared/types';
import { mockHotels } from '../../../shared/mock/index.js';

const router = Router();

const commissionRuleSchema = z.object({
  hotelId: z.string().optional(),
  roomTypeId: z.string().optional(),
  ratePlanId: z.string().optional(),
  commissionRate: z.number().min(0).max(100),
  paymentTerms: z.enum(['NET_7', 'NET_15', 'NET_30', 'NET_45', 'NET_60']).optional().default('NET_30'),
  minimumCommission: z.number().min(0).optional(),
  maximumCommission: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const settlementSchema = z.object({
  hotelId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'CANCELLED']).optional(),
});

const mockCommissionRules = [
  { id: 'rule-1', hotelId: 'all', commissionRate: 15, paymentTerms: 'NET_30', isActive: true, createdAt: '2024-01-01' },
  { id: 'rule-2', hotelId: 'hotel-paris-001', commissionRate: 12, paymentTerms: 'NET_15', isActive: true, createdAt: '2024-01-15' },
  { id: 'rule-3', hotelId: 'hotel-tokyo-001', commissionRate: 18, paymentTerms: 'NET_30', isActive: true, createdAt: '2024-02-01' },
];

const mockSettlements = [
  {
    id: 'settle-1',
    settlementNumber: 'SET-2024-01-001',
    hotelId: 'hotel-paris-001',
    hotelName: '巴黎丽思卡尔顿酒店',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    totalBookings: 45,
    totalRevenue: 45000,
    commissionRate: 12,
    commissionAmount: 5400,
    status: 'PAID',
    paidAt: '2024-02-15',
    createdAt: '2024-02-01',
  },
  {
    id: 'settle-2',
    settlementNumber: 'SET-2024-01-002',
    hotelId: 'hotel-tokyo-001',
    hotelName: '东京安缦酒店',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    totalBookings: 62,
    totalRevenue: 68000,
    commissionRate: 18,
    commissionAmount: 12240,
    status: 'PENDING',
    dueDate: '2024-03-01',
    createdAt: '2024-02-01',
  },
  {
    id: 'settle-3',
    settlementNumber: 'SET-2024-01-003',
    hotelId: 'hotel-newyork-001',
    hotelName: '纽约广场大酒店',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    totalBookings: 38,
    totalRevenue: 52000,
    commissionRate: 15,
    commissionAmount: 7800,
    status: 'DRAFT',
    createdAt: '2024-02-01',
  },
];

router.get('/rules', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    successResponse(res, {
      items: mockCommissionRules,
      defaultRate: 15,
      paymentTerms: ['NET_7', 'NET_15', 'NET_30', 'NET_45', 'NET_60'],
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/rules', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = commissionRuleSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const newRule = {
      id: `rule-${Date.now()}`,
      ...validated.data,
      createdAt: new Date().toISOString(),
    };

    mockCommissionRules.unshift(newRule);

    successResponse(res, newRule, 'Commission rule created successfully', 201);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/settlements', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, hotelId, page = '1', pageSize = '10' } = req.query;
    
    let settlements = [...mockSettlements];

    if (status) {
      settlements = settlements.filter(s => s.status === status);
    }
    if (hotelId) {
      settlements = settlements.filter(s => s.hotelId === hotelId);
    }

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedSettlements = settlements.slice(startIndex, startIndex + pageSizeNum);

    const summary = {
      totalSettlements: settlements.length,
      totalCommission: settlements.reduce((sum, s) => sum + s.commissionAmount, 0),
      pendingAmount: settlements.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + s.commissionAmount, 0),
      paidAmount: settlements.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.commissionAmount, 0),
    };

    successResponse(res, {
      items: paginatedSettlements,
      total: settlements.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(settlements.length / pageSizeNum),
      summary,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/settlements/generate', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = settlementSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { hotelId, periodStart, periodEnd } = validated.data;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const bookingsCount = Math.floor(Math.random() * 50) + 10;
    const revenue = Math.floor(Math.random() * 50000) + 10000;
    const commissionRate = 15;
    const commissionAmount = Math.round(revenue * commissionRate / 100);

    const newSettlement = {
      id: `settle-${Date.now()}`,
      settlementNumber: `SET-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(mockSettlements.length + 1).padStart(3, '0')}`,
      hotelId,
      hotelName: hotel.name,
      periodStart,
      periodEnd,
      totalBookings: bookingsCount,
      totalRevenue: revenue,
      commissionRate,
      commissionAmount,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    mockSettlements.unshift(newSettlement);

    successResponse(res, newSettlement, 'Settlement generated successfully', 201);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/settlements/:settlementId', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { settlementId } = req.params;
    const settlement = mockSettlements.find(s => s.id === settlementId);

    if (!settlement) {
      notFoundResponse(res, 'Settlement');
      return;
    }

    const { status, notes } = req.body;

    if (status) {
      settlement.status = status;
      if (status === 'PAID') {
        (settlement as any).paidAt = new Date().toISOString();
      }
    }

    successResponse(res, settlement, 'Settlement updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/dashboard', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR, UserRole.FINANCE]), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dashboardData = {
      summary: {
        totalRevenue: 1258000,
        totalCommission: 188700,
        averageCommissionRate: 15,
        activeHotels: 6,
        pendingSettlements: 3,
        pendingAmount: 25440,
      },
      monthlyTrend: [
        { month: '2024-01', revenue: 285000, commission: 42750 },
        { month: '2024-02', revenue: 312000, commission: 46800 },
        { month: '2024-03', revenue: 345000, commission: 51750 },
        { month: '2024-04', revenue: 316000, commission: 47400 },
      ],
      topHotels: mockHotels.slice(0, 5).map((hotel, index) => ({
        id: hotel.id,
        name: hotel.name,
        revenue: 250000 - index * 40000,
        commission: 37500 - index * 6000,
        bookings: 80 - index * 10,
      })),
      topChannels: [
        { channel: 'stayglobal', revenue: 580000, commission: 87000 },
        { channel: 'booking.com', revenue: 285000, commission: 42750 },
        { channel: 'trip.com', revenue: 195000, commission: 29250 },
        { channel: 'agoda', revenue: 128000, commission: 19200 },
        { channel: 'expedia', revenue: 70000, commission: 10500 },
      ],
    };

    successResponse(res, dashboardData);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
