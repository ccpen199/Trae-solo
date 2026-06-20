import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { Agency } from '../../../shared/types';
import { mockAgencies, mockArtists } from '../data/mockData';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const generateId = (): string => Math.random().toString(36).substring(2, 15);

const createAgencySchema = z.object({
  ownerId: z.string(),
  name: z.string().min(2).max(100),
  businessLicense: z.string().min(5),
  contactPerson: z.string().min(2),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  address: z.string().min(5),
});

router.get('/', authenticateToken, (_req: AuthRequest, res: Response): void => {
  try {
    res.status(200).json({
      success: true,
      data: mockAgencies,
      total: mockAgencies.length,
    });
  } catch (error) {
    res.status(500).json({ error: '获取经纪公司列表失败', code: 'SERVER_ERROR' });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const agency = mockAgencies.find(a => a.id === id);

    if (!agency) {
      res.status(404).json({ error: '经纪公司不存在', code: 'NOT_FOUND' });
      return;
    }

    const artists = mockArtists.filter(a => a.agencyId === id);

    res.status(200).json({
      success: true,
      data: {
        ...agency,
        artistsCount: artists.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '获取经纪公司详情失败', code: 'SERVER_ERROR' });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'agency_admin'), (req: AuthRequest, res: Response): void => {
  try {
    const validated = createAgencySchema.parse(req.body);

    const existing = mockAgencies.find(
      a => a.businessLicense === validated.businessLicense || a.name === validated.name
    );
    if (existing) {
      res.status(409).json({ error: '经纪公司已存在', code: 'DUPLICATE' });
      return;
    }

    const newAgency = {
      id: `agency-${generateId()}`,
      ownerId: validated.ownerId,
      name: validated.name,
      businessLicense: validated.businessLicense,
      contactPerson: validated.contactPerson,
      contactPhone: validated.contactPhone,
      address: validated.address,
      isVerified: false,
      createdAt: new Date(),
    } as Agency;

    mockAgencies.push(newAgency);

    res.status(201).json({
      success: true,
      data: newAgency,
      message: '经纪公司创建成功，等待审核',
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
    res.status(500).json({ error: '创建经纪公司失败', code: 'SERVER_ERROR' });
  }
});

router.get('/:id/artists', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const agency = mockAgencies.find(a => a.id === id);

    if (!agency) {
      res.status(404).json({ error: '经纪公司不存在', code: 'NOT_FOUND' });
      return;
    }

    const artists = mockArtists.filter(a => a.agencyId === id);

    res.status(200).json({
      success: true,
      data: artists,
      total: artists.length,
    });
  } catch (error) {
    res.status(500).json({ error: '获取公司艺人列表失败', code: 'SERVER_ERROR' });
  }
});

router.get('/:id/stats', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const agency = mockAgencies.find(a => a.id === id);

    if (!agency) {
      res.status(404).json({ error: '经纪公司不存在', code: 'NOT_FOUND' });
      return;
    }

    const artists = mockArtists.filter(a => a.agencyId === id);
    const exclusiveCount = artists.filter(a => a.contractStatus === 'exclusive').length;
    const signedCount = artists.filter(a => a.contractStatus === 'signed').length;
    const availableCount = artists.filter(a => a.contractStatus === 'available').length;

    const stats = {
      totalArtists: artists.length,
      exclusiveArtists: exclusiveCount,
      signedArtists: signedCount,
      availableArtists: availableCount,
      averageAge: artists.length > 0
        ? Math.round(artists.reduce((sum, a) => sum + a.age, 0) / artists.length * 10) / 10
        : 0,
      averageHeight: artists.length > 0
        ? Math.round(artists.reduce((sum, a) => sum + a.height, 0) / artists.length * 10) / 10
        : 0,
      citiesCovered: new Set(artists.map(a => a.location)).size,
      isVerified: agency.isVerified,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ error: '获取公司统计失败', code: 'SERVER_ERROR' });
  }
});

export default router;
