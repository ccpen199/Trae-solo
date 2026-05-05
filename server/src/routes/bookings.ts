import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, ApiResponse, CreateBookingParams } from '../types/index.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

const validBookingStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED'];

function generateOrderNo(): string {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-10);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HS${timestamp}${random}`;
}

router.post('/calculate', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, checkIn, checkOut, guests = 2 } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      const response: ApiResponse = {
        success: false,
        message: '请提供完整的预订信息',
      };
      return res.status(400).json(response);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      const response: ApiResponse = {
        success: false,
        message: '入住日期必须早于离店日期',
      };
      return res.status(400).json(response);
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      const response: ApiResponse = {
        success: false,
        message: '房源不存在',
      };
      return res.status(404).json(response);
    }

    if (guests > property.maxGuests) {
      const response: ApiResponse = {
        success: false,
        message: `该房源最多容纳${property.maxGuests}人`,
      };
      return res.status(400).json(response);
    }

    const dates: Date[] = [];
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkInDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    const availabilities = await prisma.availability.findMany({
      where: {
        propertyId,
        date: { in: dates },
      },
    });

    const unavailableDates = availabilities.filter((a) => !a.isAvailable);
    if (unavailableDates.length > 0) {
      const response: ApiResponse = {
        success: false,
        message: '所选日期部分不可用，请重新选择',
        data: { unavailableDates },
      };
      return res.status(400).json(response);
    }

    let totalRoomCost = 0;
    dates.forEach((date) => {
      const availability = availabilities.find(
        (a) => a.date.getTime() === date.getTime()
      );
      totalRoomCost += availability?.price || property.pricePerNight;
    });

    const cleaningFee = property.cleaningFee || 0;
    const serviceFee = property.serviceFee || 0;
    const deposit = property.deposit || 0;
    const totalAmount = totalRoomCost + cleaningFee + serviceFee + deposit;

    const response: ApiResponse = {
      success: true,
      data: {
        property: {
          id: property.id,
          title: property.title,
          mainImage: property.mainImage,
          address: property.address,
        },
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        guests,
        priceDetails: {
          roomCost: totalRoomCost,
          pricePerNight: property.pricePerNight,
          cleaningFee,
          serviceFee,
          deposit,
          totalAmount,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Calculate booking error:', error);
    const response: ApiResponse = {
      success: false,
      message: '计算价格失败',
    };
    res.status(500).json(response);
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      propertyId,
      checkIn,
      checkOut,
      guests = 2,
      guestName,
      guestPhone,
      specialRequest,
    }: CreateBookingParams = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      const response: ApiResponse = {
        success: false,
        message: '请提供完整的预订信息',
      };
      return res.status(400).json(response);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      const response: ApiResponse = {
        success: false,
        message: '入住日期必须早于离店日期',
      };
      return res.status(400).json(response);
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      const response: ApiResponse = {
        success: false,
        message: '房源不存在',
      };
      return res.status(404).json(response);
    }

    const dates: Date[] = [];
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkInDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    const availabilities = await prisma.availability.findMany({
      where: {
        propertyId,
        date: { in: dates },
      },
    });

    const unavailableDates = availabilities.filter((a) => !a.isAvailable);
    if (unavailableDates.length > 0) {
      const response: ApiResponse = {
        success: false,
        message: '所选日期部分不可用，请重新选择',
      };
      return res.status(400).json(response);
    }

    let totalRoomCost = 0;
    dates.forEach((date) => {
      const availability = availabilities.find(
        (a) => a.date.getTime() === date.getTime()
      );
      totalRoomCost += availability?.price || property.pricePerNight;
    });

    const cleaningFee = property.cleaningFee || 0;
    const serviceFee = property.serviceFee || 0;
    const deposit = property.deposit || 0;
    const totalAmount = totalRoomCost + cleaningFee + serviceFee + deposit;

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          id: uuidv4(),
          orderNo: generateOrderNo(),
          userId,
          propertyId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          guests,
          pricePerNight: property.pricePerNight,
          cleaningFee,
          serviceFee,
          deposit,
          totalAmount,
          status: 'PENDING',
          guestName: guestName || req.user!.phone,
          guestPhone: guestPhone || req.user!.phone,
          specialRequest,
        },
      });

      for (const date of dates) {
        await tx.availability.updateMany({
          where: {
            propertyId,
            date,
          },
          data: { isAvailable: false },
        });
      }

      return newBooking;
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...booking,
      },
      message: '订单创建成功，请前往支付',
    };

    res.json(response);
  } catch (error) {
    console.error('Create booking error:', error);
    const response: ApiResponse = {
      success: false,
      message: '创建订单失败',
    };
    res.status(500).json(response);
  }
});

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status, page = 1, pageSize = 10 } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    const skip = (pageNum - 1) * size;

    const where: any = { userId };
    if (status && validBookingStatuses.includes(status as string)) {
      where.status = status;
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              mainImage: true,
              address: true,
              pricePerNight: true,
              host: {
                include: {
                  user: { select: { nickname: true, avatar: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: size,
      }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        list: bookings,
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
    console.error('Get bookings error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取订单列表失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            city: true,
            host: {
              include: {
                user: { select: { id: true, nickname: true, avatar: true, phone: true } },
              },
            },
          },
        },
        payments: true,
        review: true,
      },
    });

    if (!booking) {
      const response: ApiResponse = {
        success: false,
        message: '订单不存在',
      };
      return res.status(404).json(response);
    }

    if (booking.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        message: '无权查看此订单',
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: booking,
    };

    res.json(response);
  } catch (error) {
    console.error('Get booking error:', error);
    const response: ApiResponse = {
      success: false,
      message: '获取订单详情失败',
    };
    res.status(500).json(response);
  }
});

router.post('/:id/pay', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { method = 'ALIPAY' } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      const response: ApiResponse = {
        success: false,
        message: '订单不存在',
      };
      return res.status(404).json(response);
    }

    if (booking.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        message: '无权操作此订单',
      };
      return res.status(403).json(response);
    }

    if (booking.status !== 'PENDING') {
      const response: ApiResponse = {
        success: false,
        message: '订单状态不正确',
      };
      return res.status(400).json(response);
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          id: uuidv4(),
          bookingId: booking.id,
          amount: booking.totalAmount,
          method,
          tradeNo: `TXN${Date.now()}`,
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      return updated;
    });

    const response: ApiResponse = {
      success: true,
      data: updatedBooking,
      message: '支付成功',
    };

    res.json(response);
  } catch (error) {
    console.error('Pay booking error:', error);
    const response: ApiResponse = {
      success: false,
      message: '支付失败',
    };
    res.status(500).json(response);
  }
});

router.post('/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      const response: ApiResponse = {
        success: false,
        message: '订单不存在',
      };
      return res.status(404).json(response);
    }

    if (booking.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        message: '无权操作此订单',
      };
      return res.status(403).json(response);
    }

    if (booking.status !== 'PENDING' && booking.status !== 'PAID') {
      const response: ApiResponse = {
        success: false,
        message: '订单状态不允许取消',
      };
      return res.status(400).json(response);
    }

    const dates: Date[] = [];
    for (let i = 0; i < booking.nights; i++) {
      const d = new Date(booking.checkIn);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    await prisma.$transaction(async (tx) => {
      for (const date of dates) {
        await tx.availability.updateMany({
          where: {
            propertyId: booking.propertyId,
            date,
          },
          data: { isAvailable: true },
        });
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });
    });

    const response: ApiResponse = {
      success: true,
      message: '订单已取消',
    };

    res.json(response);
  } catch (error) {
    console.error('Cancel booking error:', error);
    const response: ApiResponse = {
      success: false,
      message: '取消订单失败',
    };
    res.status(500).json(response);
  }
});

export default router;
