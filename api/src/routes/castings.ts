import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { Casting, CastingApplication } from '../../../shared/types';
import { mockCastings, mockCastingApplications } from '../data/mockData';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const generateId = (): string => Math.random().toString(36).substring(2, 15);

const castingListQuerySchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 10),
  category: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed', 'completed']).optional(),
  budgetMin: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  budgetMax: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
});

const createCastingSchema = z.object({
  agencyId: z.string(),
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  category: z.string(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  location: z.string(),
  startDate: z.string().transform(v => new Date(v)),
  endDate: z.string().transform(v => new Date(v)),
  status: z.enum(['draft', 'published', 'closed', 'completed']).default('draft'),
  requirements: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'gte', 'lte', 'in', 'between']),
    value: z.any(),
  })).default([]),
});

const applySchema = z.object({
  artistProfileId: z.string(),
  coverLetter: z.string().max(2000).optional(),
});

router.get('/', (req: Request, res: Response): void => {
  try {
    const query = castingListQuerySchema.parse(req.query);
    const { page, limit, category, location, status, budgetMin, budgetMax } = query;

    let filtered = [...mockCastings];

    if (category) filtered = filtered.filter(c => c.category === category);
    if (location) filtered = filtered.filter(c => c.location.includes(location));
    if (status) filtered = filtered.filter(c => c.status === status);
    if (budgetMin) filtered = filtered.filter(c => c.budgetMax >= budgetMin);
    if (budgetMax) filtered = filtered.filter(c => c.budgetMin <= budgetMax);

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '查询参数错误',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '获取招募列表失败', code: 'SERVER_ERROR' });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const casting = mockCastings.find(c => c.id === id);

    if (!casting) {
      res.status(404).json({ error: '招募不存在', code: 'NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data: casting,
    });
  } catch (error) {
    res.status(500).json({ error: '获取招募详情失败', code: 'SERVER_ERROR' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const validated = createCastingSchema.parse(req.body);

    const newCasting = {
      id: `casting-${generateId()}`,
      agencyId: validated.agencyId,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      budgetMin: validated.budgetMin,
      budgetMax: validated.budgetMax,
      location: validated.location,
      startDate: validated.startDate,
      endDate: validated.endDate,
      status: validated.status,
      requirements: validated.requirements,
      createdAt: new Date(),
    } as Casting;

    mockCastings.push(newCasting);

    res.status(201).json({
      success: true,
      data: newCasting,
      message: '招募创建成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '创建招募失败', code: 'SERVER_ERROR' });
  }
});

router.post('/:id/apply', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const validated = applySchema.parse(req.body);

    const casting = mockCastings.find(c => c.id === id);
    if (!casting) {
      res.status(404).json({ error: '招募不存在', code: 'NOT_FOUND' });
      return;
    }

    if (casting.status !== 'published') {
      res.status(400).json({ error: '该招募不接受申请', code: 'NOT_ACCEPTING' });
      return;
    }

    const existingApplication = mockCastingApplications.find(
      a => a.castingId === id && a.artistProfileId === validated.artistProfileId
    );
    if (existingApplication) {
      res.status(409).json({ error: '您已申请过该招募', code: 'DUPLICATE_APPLICATION' });
      return;
    }

    const newApplication: CastingApplication = {
      id: `app-${generateId()}`,
      castingId: id,
      artistProfileId: validated.artistProfileId,
      status: 'pending',
      coverLetter: validated.coverLetter,
      appliedAt: new Date(),
    };

    mockCastingApplications.push(newApplication);

    res.status(201).json({
      success: true,
      data: newApplication,
      message: '申请成功，请等待审核',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '输入验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '申请失败', code: 'SERVER_ERROR' });
  }
});

router.get('/:id/applications', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;

    const casting = mockCastings.find(c => c.id === id);
    if (!casting) {
      res.status(404).json({ error: '招募不存在', code: 'NOT_FOUND' });
      return;
    }

    const applications = mockCastingApplications.filter(a => a.castingId === id);

    res.status(200).json({
      success: true,
      data: applications,
      total: applications.length,
    });
  } catch (error) {
    res.status(500).json({ error: '获取申请列表失败', code: 'SERVER_ERROR' });
  }
});

export default router;
