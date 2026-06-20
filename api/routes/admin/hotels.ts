import { Router, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../../utils/response.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../../middleware/auth.js';
import { Hotel, HotelStatus, UserRole } from '@shared/types';
import { mockHotels } from '../../../shared/mock/index.js';

const router = Router();

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

const updateHotelSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_REVIEW']).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  paymentTerms: z.enum(['NET_7', 'NET_15', 'NET_30', 'NET_45', 'NET_60']).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

router.get('/', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hotels = mockHotels.map(hotel => ({
      ...hotel,
      bookingCount: Math.floor(Math.random() * 500),
      revenue: Math.floor(Math.random() * 500000),
      commissionEarned: Math.floor(Math.random() * 50000),
    }));

    const stats = {
      total: hotels.length,
      active: hotels.filter(h => h.status === HotelStatus.ACTIVE).length,
      pending: hotels.filter(h => h.status === HotelStatus.PENDING_REVIEW).length,
      inactive: hotels.filter(h => h.status === HotelStatus.INACTIVE).length,
      suspended: hotels.filter(h => h.status === HotelStatus.SUSPENDED).length,
    };

    successResponse(res, {
      items: hotels,
      stats,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/pending', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pendingHotels = mockHotels.filter(h => h.status === HotelStatus.PENDING_REVIEW);
    successResponse(res, pendingHotels);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/:hotelId', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const reviewHistory = [
      {
        id: 'review-1',
        reviewerId: 'admin-1',
        reviewerName: '张管理员',
        action: 'SUBMITTED',
        timestamp: '2024-01-10T10:00:00Z',
        notes: '酒店提交入驻申请',
      },
      {
        id: 'review-2',
        reviewerId: 'admin-2',
        reviewerName: '李审核员',
        action: 'INFO_REQUESTED',
        timestamp: '2024-01-11T14:30:00Z',
        notes: '请补充营业执照扫描件',
      },
      {
        id: 'review-3',
        reviewerId: 'hotel-1',
        reviewerName: '王经理',
        action: 'INFO_PROVIDED',
        timestamp: '2024-01-12T09:15:00Z',
        notes: '已上传营业执照和经营许可证',
      },
    ];

    successResponse(res, {
      hotel,
      reviewHistory,
      contracts: [
        { id: 'contract-1', type: 'MASTER', status: 'SIGNED', startDate: '2024-01-15', endDate: '2025-01-14' },
      ],
      documents: [
        { id: 'doc-1', name: '营业执照', type: 'LICENSE', status: 'VERIFIED', uploadedAt: '2024-01-12T09:15:00Z' },
        { id: 'doc-2', name: '经营许可证', type: 'PERMIT', status: 'VERIFIED', uploadedAt: '2024-01-12T09:16:00Z' },
        { id: 'doc-3', name: '消防验收证明', type: 'CERTIFICATE', status: 'PENDING', uploadedAt: '2024-01-12T09:17:00Z' },
      ],
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:hotelId/review', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    if (hotel.status !== HotelStatus.PENDING_REVIEW) {
      errorResponse(res, 'INVALID_STATUS', 'Only pending review hotels can be reviewed');
      return;
    }

    const validated = reviewSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { status, reviewNotes } = validated.data;

    hotel.status = status === 'APPROVED' ? HotelStatus.ACTIVE : HotelStatus.REJECTED;
    hotel.updatedAt = new Date().toISOString();

    successResponse(res, {
      hotel,
      reviewResult: {
        status,
        reviewedBy: req.user?.email,
        reviewedAt: new Date().toISOString(),
        notes: reviewNotes,
      },
    }, `Hotel ${status.toLowerCase()} successfully`);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/:hotelId', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const validated = updateHotelSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    Object.assign(hotel, validated.data);
    hotel.updatedAt = new Date().toISOString();

    successResponse(res, hotel, 'Hotel updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:hotelId/suspend', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    const { reason } = req.body;

    hotel.status = HotelStatus.SUSPENDED;
    hotel.updatedAt = new Date().toISOString();

    successResponse(res, {
      hotel,
      suspension: {
        reason,
        suspendedBy: req.user?.email,
        suspendedAt: new Date().toISOString(),
      },
    }, 'Hotel suspended successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/:hotelId/reactivate', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = mockHotels.find(h => h.id === hotelId);

    if (!hotel) {
      notFoundResponse(res, 'Hotel');
      return;
    }

    if (hotel.status !== HotelStatus.SUSPENDED && hotel.status !== HotelStatus.INACTIVE) {
      errorResponse(res, 'INVALID_STATUS', 'Only suspended or inactive hotels can be reactivated');
      return;
    }

    hotel.status = HotelStatus.ACTIVE;
    hotel.updatedAt = new Date().toISOString();

    successResponse(res, hotel, 'Hotel reactivated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
