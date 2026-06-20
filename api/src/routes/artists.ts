import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { ArtistProfile, Schedule } from '../../../shared/types';
import { mockArtists, mockSchedules, mockAuthorizations } from '../data/mockData';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { maskArtistProfile } from '../utils/security';

const router = Router();

const artistListQuerySchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 10),
  gender: z.enum(['male', 'female', 'other']).optional(),
  ageMin: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  ageMax: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  heightMin: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  heightMax: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  location: z.string().optional(),
  contractStatus: z.enum(['available', 'signed', 'exclusive', 'unavailable']).optional(),
});

const createArtistSchema = z.object({
  userId: z.string(),
  realName: z.string().min(2),
  stageName: z.string().optional(),
  age: z.number().min(14).max(80),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(100).max(250),
  weight: z.number().min(20).max(200),
  bust: z.number().optional(),
  waist: z.number().optional(),
  hips: z.number().optional(),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  languages: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  location: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contractStatus: z.enum(['available', 'signed', 'exclusive', 'unavailable']).default('available'),
  agencyId: z.string().optional(),
  tags: z.array(z.object({
    tag: z.string(),
    category: z.enum(['appearance', 'skill', 'language', 'experience']),
    weight: z.number().min(0).max(10),
  })).default([]),
});

const updateArtistSchema = createArtistSchema.partial();

const generateId = (): string => Math.random().toString(36).substring(2, 15);

router.get('/', (req: Request, res: Response): void => {
  try {
    const query = artistListQuerySchema.parse(req.query);
    const { page, limit, gender, ageMin, ageMax, heightMin, heightMax, location, contractStatus } = query;

    let filtered = [...mockArtists];

    if (gender) filtered = filtered.filter(a => a.gender === gender);
    if (ageMin) filtered = filtered.filter(a => a.age >= ageMin);
    if (ageMax) filtered = filtered.filter(a => a.age <= ageMax);
    if (heightMin) filtered = filtered.filter(a => a.height >= heightMin);
    if (heightMax) filtered = filtered.filter(a => a.height <= heightMax);
    if (location) filtered = filtered.filter(a => a.location.includes(location));
    if (contractStatus) filtered = filtered.filter(a => a.contractStatus === contractStatus);

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
    res.status(500).json({ error: '获取艺人列表失败', code: 'SERVER_ERROR' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const artist = mockArtists.find(a => a.id === id);

    if (!artist) {
      res.status(404).json({ error: '艺人不存在', code: 'NOT_FOUND' });
      return;
    }

    let result: ArtistProfile = artist;

    if (req.user) {
      const authorization = mockAuthorizations.find(
        a => a.grantorId === artist.userId && a.granteeId === req.user!.id && !a.isRevoked
      );
      result = maskArtistProfile(artist, authorization || null);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ error: '获取艺人详情失败', code: 'SERVER_ERROR' });
  }
});

router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const validated = createArtistSchema.parse(req.body);

    const existing = mockArtists.find(a => a.userId === validated.userId);
    if (existing) {
      res.status(409).json({ error: '该用户已创建艺人资料', code: 'DUPLICATE' });
      return;
    }

    const newArtist = {
      id: `artist-${generateId()}`,
      userId: validated.userId,
      realName: validated.realName,
      stageName: validated.stageName || validated.realName,
      age: validated.age,
      gender: validated.gender,
      height: validated.height,
      weight: validated.weight,
      bust: validated.bust || 0,
      waist: validated.waist || 0,
      hips: validated.hips || 0,
      eyeColor: validated.eyeColor || '',
      hairColor: validated.hairColor || '',
      languages: validated.languages,
      skills: validated.skills,
      location: validated.location,
      latitude: validated.latitude || 0,
      longitude: validated.longitude || 0,
      contractStatus: validated.contractStatus,
      agencyId: validated.agencyId,
      mediaAssets: [],
      tags: validated.tags.map(t => ({
        id: generateId(),
        tag: t.tag,
        category: t.category,
        weight: t.weight,
      })),
    } as ArtistProfile;

    mockArtists.push(newArtist);

    res.status(201).json({
      success: true,
      data: newArtist,
      message: '艺人资料创建成功',
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
    res.status(500).json({ error: '创建艺人资料失败', code: 'SERVER_ERROR' });
  }
});

router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const validated = updateArtistSchema.parse(req.body);

    const index = mockArtists.findIndex(a => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: '艺人不存在', code: 'NOT_FOUND' });
      return;
    }

    if (req.user && req.user.id !== mockArtists[index].userId && req.user.role !== 'admin') {
      res.status(403).json({ error: '无权修改此资料', code: 'FORBIDDEN' });
      return;
    }

    mockArtists[index] = {
      ...mockArtists[index],
      ...validated,
    } as ArtistProfile;

    res.status(200).json({
      success: true,
      data: mockArtists[index],
      message: '艺人资料更新成功',
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
    res.status(500).json({ error: '更新艺人资料失败', code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const index = mockArtists.findIndex(a => a.id === id);

    if (index === -1) {
      res.status(404).json({ error: '艺人不存在', code: 'NOT_FOUND' });
      return;
    }

    if (req.user && req.user.id !== mockArtists[index].userId && req.user.role !== 'admin') {
      res.status(403).json({ error: '无权删除此资料', code: 'FORBIDDEN' });
      return;
    }

    mockArtists.splice(index, 1);

    res.status(200).json({
      success: true,
      message: '艺人资料删除成功',
    });
  } catch (error) {
    res.status(500).json({ error: '删除艺人资料失败', code: 'SERVER_ERROR' });
  }
});

router.get('/:id/schedule', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const artist = mockArtists.find(a => a.id === id);

    if (!artist) {
      res.status(404).json({ error: '艺人不存在', code: 'NOT_FOUND' });
      return;
    }

    const schedules: Schedule[] = mockSchedules.filter(s => s.artistProfileId === id);

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({ error: '获取艺人日程失败', code: 'SERVER_ERROR' });
  }
});

export default router;
