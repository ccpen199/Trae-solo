import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, ApiResponse } from '../types/index.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/hot', async (req: AuthRequest, res: Response) => {
  try {
    const hotCities = await prisma.city.findMany({
      where: { isHot: true },
      orderBy: { sort: 'asc' },
    });

    const response: ApiResponse = {
      success: true,
      data: hotCities,
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

router.get('/domestic', async (req: AuthRequest, res: Response) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isDomestic: true },
      orderBy: { sort: 'asc' },
    });

    const grouped: Record<string, any[]> = {};
    cities.forEach((city) => {
      const province = city.province || '其他';
      if (!grouped[province]) {
        grouped[province] = [];
      }
      grouped[province].push(city);
    });

    const response: ApiResponse = {
      success: true,
      data: grouped,
    };

    res.json(response);
  } catch (error) {
    console.error('Get domestic cities error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取国内城市失败',
    };
    res.status(500).json(response);
  }
});

router.get('/overseas', async (req: AuthRequest, res: Response) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isDomestic: false },
      orderBy: { sort: 'asc' },
    });

    const grouped: Record<string, any[]> = {};
    cities.forEach((city) => {
      const country = city.country || '其他';
      if (!grouped[country]) {
        grouped[country] = [];
      }
      grouped[country].push(city);
    });

    const response: ApiResponse = {
      success: true,
      data: grouped,
    };

    res.json(response);
  } catch (error) {
    console.error('Get overseas cities error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取海外城市失败',
    };
    res.status(500).json(response);
  }
});

router.get('/search', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      const response: ApiResponse = {
        success: false,
        message: '请输入搜索关键词',
      };
      return res.status(400).json(response);
    }

    const searchKeyword = keyword.toLowerCase();

    const cities = await prisma.city.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { nameEn: { contains: keyword, mode: 'insensitive' } },
          { pinyin: { contains: searchKeyword } },
        ],
      },
      orderBy: [{ isHot: 'desc' }, { sort: 'asc' }],
      take: 20,
    });

    if (req.user?.userId && cities.length > 0) {
      const firstCity = cities[0];
      await prisma.searchHistory.upsert({
        where: {
          id: '',
        },
        update: {
          createdAt: new Date(),
        },
        create: {
          userId: req.user.userId,
          keyword: firstCity.name,
          type: 'DESTINATION',
          cityId: firstCity.id,
        },
      });
    }

    const response: ApiResponse = {
      success: true,
      data: cities,
    };

    res.json(response);
  } catch (error) {
    console.error('Search cities error:', error);
    const response: ApiResponse = {
      success: false,
      message: '搜索城市失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      const response: ApiResponse = {
        success: false,
        message: '城市不存在',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: city,
    };

    res.json(response);
  } catch (error) {
    console.error('Get city error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取城市信息失败',
    };
    res.status(500).json(response);
  }
});

export default router;
