import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, ApiResponse } from '../types/index.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/banners', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { sort: 'asc' },
    });

    const response: ApiResponse = {
      success: true,
      data: banners,
    };

    res.json(response);
  } catch (error) {
    console.error('Get banners error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取Banner失败',
    };
    res.status(500).json(response);
  }
});

router.get('/topics', async (req: AuthRequest, res: Response) => {
  try {
    const topics = await prisma.activityTopic.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
    });

    const response: ApiResponse = {
      success: true,
      data: topics,
    };

    res.json(response);
  } catch (error) {
    console.error('Get topics error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取出行专题失败',
    };
    res.status(500).json(response);
  }
});

router.get('/hot-cities', async (req: AuthRequest, res: Response) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isHot: true },
      orderBy: { sort: 'asc' },
      take: 12,
    });

    const response: ApiResponse = {
      success: true,
      data: cities,
    };

    res.json(response);
  } catch (error) {
    console.error('Get hot cities error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取热门城市失败',
    };
    res.status(500).json(response);
  }
});

router.get('/recommended-properties', async (req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      where: { isActive: true },
      include: {
        city: true,
        host: {
          include: {
            user: {
              select: { nickname: true, avatar: true },
            },
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { viewCount: 'desc' },
      ],
      take: 10,
    });

    const mappedProperties = properties.map((p) => ({
      ...p,
      facilities: JSON.parse(p.facilities),
      images: JSON.parse(p.images),
      houseRules: p.houseRules ? JSON.parse(p.houseRules) : null,
    }));

    const response: ApiResponse = {
      success: true,
      data: mappedProperties,
    };

    res.json(response);
  } catch (error) {
    console.error('Get recommended properties error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取推荐房源失败',
    };
    res.status(500).json(response);
  }
});

router.get('/search-history', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      const response: ApiResponse = {
        success: true,
        data: [],
      };
      return res.json(response);
    }

    const history = await prisma.searchHistory.findMany({
      where: { userId: req.user.userId },
      include: {
        city: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const response: ApiResponse = {
      success: true,
      data: history,
    };

    res.json(response);
  } catch (error) {
    console.error('Get search history error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取搜索历史失败',
    };
    res.status(500).json(response);
  }
});

router.delete('/search-history', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      const response: ApiResponse = {
        success: true,
        message: '已清空搜索历史',
      };
      return res.json(response);
    }

    await prisma.searchHistory.deleteMany({
      where: { userId: req.user.userId },
    });

    const response: ApiResponse = {
      success: true,
      message: '已清空搜索历史',
    };

    res.json(response);
  } catch (error) {
    console.error('Clear search history error:', error);
    const response: ApiResponse = {
      success: false,
      message: '清空搜索历史失败',
    };
    res.status(500).json(response);
  }
});

export default router;
