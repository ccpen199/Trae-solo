import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, ApiResponse, SearchParams } from '../types/index.js';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const validPropertyTypes = ['APARTMENT', 'HOUSE', 'VILLA', 'LOFT', 'STUDIO', 'CABIN'];

router.get('/search', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      keyword,
      cityId,
      checkIn,
      checkOut,
      guests = 2,
      minPrice,
      maxPrice,
      propertyType,
      rating,
      page = 1,
      pageSize = 20,
      sortBy = 'rating',
      sortOrder = 'desc',
    }: SearchParams = req.query as any;

    const pageNum = parseInt(page as any) || 1;
    const size = parseInt(pageSize as any) || 20;
    const skip = (pageNum - 1) * size;

    const where: any = {
      isActive: true,
    };

    if (cityId) {
      where.cityId = cityId;
    }

    if (keyword && typeof keyword === 'string') {
      where.OR = [
        { title: { contains: keyword } },
        { subtitle: { contains: keyword } },
        { address: { contains: keyword } },
        { intro: { contains: keyword } },
        {
          city: {
            name: { contains: keyword },
          },
        },
      ];
    }

    if (minPrice) {
      where.pricePerNight = { ...where.pricePerNight, gte: parseInt(minPrice as any) };
    }

    if (maxPrice) {
      where.pricePerNight = { ...where.pricePerNight, lte: parseInt(maxPrice as any) };
    }

    if (propertyType && validPropertyTypes.includes(propertyType as string)) {
      where.type = propertyType;
    }

    if (rating) {
      where.rating = { gte: parseFloat(rating as any) };
    }

    if (guests) {
      where.maxGuests = { gte: parseInt(guests as any) };
    }

    let orderBy: any = {};
    if (sortBy === 'price') {
      orderBy = { pricePerNight: sortOrder };
    } else if (sortBy === 'views') {
      orderBy = { viewCount: sortOrder };
    } else {
      orderBy = { rating: sortOrder };
    }

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
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
        orderBy,
        skip,
        take: size,
      }),
    ]);

    const mappedProperties = properties.map((p) => ({
      ...p,
      facilities: JSON.parse(p.facilities),
      images: JSON.parse(p.images),
      houseRules: p.houseRules ? JSON.parse(p.houseRules) : null,
    }));

    if (req.user?.userId && (cityId || keyword)) {
      await prisma.searchHistory.create({
        data: {
          userId: req.user.userId,
          keyword: keyword || (cityId ? `城市ID: ${cityId}` : ''),
          type: 'KEYWORD',
          cityId: cityId || null,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
        },
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        list: mappedProperties,
        pagination: {
          page: pageNum,
          pageSize: size,
          total,
          totalPages: Math.ceil(total / size),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Search properties error:', error);
    const response: ApiResponse = {
      success: false,
      message: '搜索房源失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        city: true,
        host: {
          include: {
            user: {
              select: { id: true, nickname: true, avatar: true },
            },
            properties: {
              where: { isActive: true, NOT: { id } },
              take: 3,
            },
          },
        },
        reviews: {
          include: {
            booking: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!property) {
      const response: ApiResponse = {
        success: false,
        message: '房源不存在',
      };
      return res.status(404).json(response);
    }

    await prisma.property.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    let isFavorite = false;
    if (req.user?.userId) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_propertyId: {
            userId: req.user.userId,
            propertyId: id,
          },
        },
      });
      isFavorite = !!favorite;
    }

    const mappedProperty = {
      ...property,
      facilities: JSON.parse(property.facilities),
      images: JSON.parse(property.images),
      houseRules: property.houseRules ? JSON.parse(property.houseRules) : null,
      isFavorite,
    };

    const response: ApiResponse = {
      success: true,
      data: mappedProperty,
    };

    res.json(response);
  } catch (error) {
    console.error('Get property error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取房源详情失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id/availability', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate
      ? new Date(endDate as string)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const availabilities = await prisma.availability.findMany({
      where: {
        propertyId: id,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    const property = await prisma.property.findUnique({
      where: { id },
      select: { pricePerNight: true },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        defaultPrice: property?.pricePerNight || 0,
        availabilities: availabilities.map((a) => ({
          date: a.date,
          isAvailable: a.isAvailable,
          price: a.price || property?.pricePerNight,
        })),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Get availability error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取房态失败',
    };
    res.status(500).json(response);
  }
});

router.post('/:id/favorite', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      const response: ApiResponse = {
        success: false,
        message: '房源不存在',
      };
      return res.status(404).json(response);
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId: id } },
    });

    let isFavorite: boolean;

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_propertyId: { userId, propertyId: id } },
      });
      await prisma.property.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      });
      isFavorite = false;
    } else {
      await prisma.favorite.create({
        data: { userId, propertyId: id },
      });
      await prisma.property.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      });
      isFavorite = true;
    }

    const response: ApiResponse = {
      success: true,
      data: { isFavorite },
    };

    res.json(response);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    const response: ApiResponse = {
      success: false,
      message: '操作收藏失败',
    };
    res.status(500).json(response);
  }
});

export default router;
