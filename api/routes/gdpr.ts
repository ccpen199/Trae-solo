import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.js';
import { GDPRRequest, GDPRRequestType, GDPRRequestStatus, UserRole } from '@shared/types';
import { mockGDPRRequests, mockBookings, mockUsers, getGDPRRequestsByUserId, getGDPRRequestById } from '../../shared/mock/index.js';

const router = Router();

const createRequestSchema = z.object({
  type: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection', 'automated_decision']),
  description: z.string().optional(),
  specificData: z.string().array().optional(),
  rectificationData: z.record(z.any()).optional(),
  exportFormat: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']),
  responseNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { status, page = '1', pageSize = '10' } = req.query;
    let requests = getGDPRRequestsByUserId(req.user.id);

    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedRequests = requests.slice(startIndex, startIndex + pageSizeNum);

    successResponse(res, {
      items: paginatedRequests,
      total: requests.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(requests.length / pageSizeNum),
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const validated = createRequestSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { type, description, specificData, rectificationData, exportFormat } = validated.data;

    const requestNumber = `GDPR-${new Date().getFullYear()}-${String(mockGDPRRequests.length + 1).padStart(6, '0')}`;

    const newRequest: GDPRRequest = {
      id: `gdpr-${Date.now()}`,
      requestNumber,
      userId: req.user.id,
      type: type as GDPRRequestType,
      status: GDPRRequestStatus.PENDING,
      description,
      specificData,
      rectificationData,
      exportFormat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    mockGDPRRequests.unshift(newRequest);

    successResponse(res, newRequest, 'GDPR request submitted successfully', 201);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/me/:requestId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { requestId } = req.params;
    const request = getGDPRRequestById(requestId);

    if (!request) {
      notFoundResponse(res, 'GDPRRequest');
      return;
    }

    if (request.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have access to this request', undefined, 403);
      return;
    }

    successResponse(res, request);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/me/:requestId/cancel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const { requestId } = req.params;
    const request = getGDPRRequestById(requestId);

    if (!request) {
      notFoundResponse(res, 'GDPRRequest');
      return;
    }

    if (request.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PLATFORM_OPERATOR') {
      errorResponse(res, 'FORBIDDEN', 'You do not have permission to cancel this request', undefined, 403);
      return;
    }

    if (request.status === GDPRRequestStatus.COMPLETED || request.status === GDPRRequestStatus.REJECTED) {
      errorResponse(res, 'INVALID_STATUS', 'Cannot cancel a completed or rejected request');
      return;
    }

    request.status = GDPRRequestStatus.REJECTED;
    request.updatedAt = new Date().toISOString();
    request.responseNotes = 'Request cancelled by user';

    successResponse(res, request, 'Request cancelled successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/me/data/export', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const user = mockUsers.find(u => u.id === req.user.id);
    if (!user) {
      notFoundResponse(res, 'User');
      return;
    }

    const bookings = mockBookings.filter(b => b.guestInfo.some(g => g.email === user.email));

    const exportData = {
      personalInfo: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        locale: user.locale,
        preferredCurrency: user.preferredCurrency,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      bookings: bookings.map(b => ({
        id: b.id,
        orderNumber: b.orderNumber,
        hotelName: b.hotelName,
        roomTypeName: b.roomTypeName,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        status: b.status,
        totalAmount: b.pricing.total,
        guestInfo: b.guestInfo,
      })),
      communicationHistory: [],
      marketingPreferences: {
        emailOptIn: true,
        smsOptIn: false,
        pushOptIn: true,
      },
      exportedAt: new Date().toISOString(),
    };

    const format = (req.query.format as string) || 'json';

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${req.user.id}.csv"`);
      const csvContent = Object.entries(exportData.personalInfo)
        .map(([key, value]) => `${key},"${value}"`)
        .join('\n');
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${req.user.id}.json"`);
      res.send(JSON.stringify(exportData, null, 2));
    }
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/requests', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, page = '1', pageSize = '10' } = req.query;
    let requests = [...mockGDPRRequests];

    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    if (type) {
      requests = requests.filter(r => r.type === type);
    }

    requests.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedRequests = requests.slice(startIndex, startIndex + pageSizeNum);

    const stats = {
      total: mockGDPRRequests.length,
      pending: mockGDPRRequests.filter(r => r.status === GDPRRequestStatus.PENDING).length,
      inProgress: mockGDPRRequests.filter(r => r.status === GDPRRequestStatus.IN_PROGRESS).length,
      completed: mockGDPRRequests.filter(r => r.status === GDPRRequestStatus.COMPLETED).length,
      rejected: mockGDPRRequests.filter(r => r.status === GDPRRequestStatus.REJECTED).length,
    };

    successResponse(res, {
      items: paginatedRequests,
      total: requests.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(requests.length / pageSizeNum),
      stats,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.put('/requests/:requestId', authMiddleware, roleMiddleware([UserRole.SUPER_ADMIN, UserRole.PLATFORM_OPERATOR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const request = getGDPRRequestById(requestId);

    if (!request) {
      notFoundResponse(res, 'GDPRRequest');
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

    const { status, responseNotes, rejectionReason } = validated.data;

    request.status = status as GDPRRequestStatus;
    request.responseNotes = responseNotes;
    request.rejectionReason = rejectionReason;
    request.updatedAt = new Date().toISOString();

    if (status === 'COMPLETED') {
      request.completedAt = new Date().toISOString();
    }

    successResponse(res, request, 'Request updated successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/rights', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rights = [
      {
        code: 'access',
        name: '访问权',
        description: '您有权访问我们持有的关于您的个人数据',
        processingTime: '14天',
        documents: ['身份证明'],
      },
      {
        code: 'rectification',
        name: '更正权',
        description: '您有权要求更正不准确或不完整的个人数据',
        processingTime: '14天',
        documents: ['身份证明', '更正证明材料'],
      },
      {
        code: 'erasure',
        name: '删除权（被遗忘权）',
        description: '您有权要求删除您的个人数据，但需符合法律规定的例外情形',
        processingTime: '30天',
        documents: ['身份证明'],
      },
      {
        code: 'portability',
        name: '数据可携权',
        description: '您有权以结构化、通用、机器可读的格式获取您的个人数据',
        processingTime: '14天',
        documents: ['身份证明'],
        formats: ['JSON', 'CSV', 'PDF'],
      },
      {
        code: 'restriction',
        name: '限制处理权',
        description: '您有权要求我们限制对您个人数据的处理',
        processingTime: '14天',
        documents: ['身份证明', '限制处理理由说明'],
      },
      {
        code: 'objection',
        name: '反对权',
        description: '您有权随时反对基于合法利益处理您的个人数据',
        processingTime: '14天',
        documents: ['身份证明', '反对理由说明'],
      },
      {
        code: 'automated_decision',
        name: '不受自动化决策约束的权利',
        description: '您有权不受仅基于自动化处理（包括画像）作出的决策的约束',
        processingTime: '14天',
        documents: ['身份证明'],
      },
    ];

    successResponse(res, {
      rights,
      contact: {
        email: 'privacy@stayglobal.com',
        phone: '+86-400-888-8888',
        address: '中国上海市浦东新区世纪大道1号',
      },
      supervisoryAuthority: {
        name: '国家互联网信息办公室',
        url: 'http://www.cac.gov.cn',
      },
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
