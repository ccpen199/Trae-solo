import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { ReservationStatus, RoomType, ChannelType } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { channelSyncEngine } from '../engines/channelSyncEngine';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, channelId, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (startDate && endDate) {
      where.OR = [
        { checkInDate: { gte: new Date(startDate as string), lte: new Date(endDate as string) } },
        { checkOutDate: { gte: new Date(startDate as string), lte: new Date(endDate as string) } },
      ];
    }

    const total = await prisma.reservation.count({ where });

    const reservations = await prisma.reservation.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
      orderBy: { createdAt: 'desc' },
      include: {
        channel: true,
        guest: true,
        room: true,
        checkIn: true,
      },
    });

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string)),
        },
      },
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/pre-arrivals', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.CONFIRMED,
        checkInDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        channel: true,
        guest: true,
        room: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    res.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error('Get pre-arrivals error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/pre-departures', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservations = await prisma.reservation.findMany({
      where: {
        status: ReservationStatus.CHECKED_IN,
        checkOutDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        channel: true,
        guest: true,
        room: true,
        checkIn: true,
      },
      orderBy: { checkOutDate: 'asc' },
    });

    res.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error('Get pre-departures error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        channel: true,
        guest: true,
        room: true,
        checkIn: {
          include: {
            room: true,
            guest: true,
          },
        },
        bill: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: '预订记录不存在',
      });
    }

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', requireRoles('ADMIN', 'FRONT_DESK'), [
  body('guest.name').notEmpty().withMessage('客人姓名不能为空'),
  body('guest.phone').optional(),
  body('guest.idCardNumber').optional(),
  body('roomType').isIn(Object.values(RoomType)).withMessage('无效的房型'),
  body('checkInDate').isISO8601().withMessage('入住日期格式无效'),
  body('checkOutDate').isISO8601().withMessage('退房日期格式无效'),
  body('adultCount').isInt({ min: 1 }).withMessage('成人数量必须为正整数'),
  body('childCount').optional().isInt({ min: 0 }).withMessage('儿童数量不能为负数'),
  body('roomRate').isDecimal({ min: '0' }).withMessage('房价必须为正数'),
  body('depositAmount').optional().isDecimal({ min: '0' }).withMessage('押金不能为负数'),
  body('specialRequests').optional(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    const { guest, roomType, checkInDate, checkOutDate, adultCount, childCount, roomRate, depositAmount, specialRequests } = req.body;
    const user = req.user!;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: '退房日期必须晚于入住日期',
      });
    }

    const isAvailable = await channelSyncEngine.checkInventory(roomType, checkIn, checkOut);

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: '所选房型在该时间段已无可用房间',
      });
    }

    const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = roomRate * totalNights;

    const channels = await prisma.channel.findFirst({
      where: { type: ChannelType.DIRECT },
    });

    if (!channels) {
      return res.status(500).json({
        success: false,
        message: '默认渠道未配置',
      });
    }

    let guestRecord = await prisma.guest.findFirst({
      where: {
        OR: [
          { idCardNumber: guest.idCardNumber },
          { phone: guest.phone },
        ],
      },
    });

    if (!guestRecord) {
      guestRecord = await prisma.guest.create({
        data: {
          name: guest.name,
          phone: guest.phone,
          idCardNumber: guest.idCardNumber,
        },
      });
    }

    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const count = await prisma.reservation.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    const reservationNo = `RSV${dateStr}${(count + 1).toString().padStart(4, '0')}`;

    const reservation = await prisma.reservation.create({
      data: {
        reservationNo,
        channelId: channels.id,
        guestId: guestRecord.id,
        roomType,
        status: ReservationStatus.CONFIRMED,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adultCount,
        childCount: childCount || 0,
        totalNights,
        roomRate,
        totalAmount,
        depositAmount: depositAmount || 0,
        specialRequests,
      },
      include: {
        channel: true,
        guest: true,
      },
    });

    const billCount = await prisma.bill.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    await prisma.bill.create({
      data: {
        billNo: `BL${dateStr}${(billCount + 1).toString().padStart(6, '0')}`,
        reservationId: reservation.id,
        guestId: guestRecord.id,
        totalAmount,
        paidAmount: depositAmount || 0,
        balance: totalAmount - (depositAmount || 0),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_RESERVATION',
        module: 'Reservation',
        targetType: 'Reservation',
        targetId: reservation.id,
        operatorId: user.id,
        operatorName: user.name,
        newValue: JSON.parse(JSON.stringify(reservation)),
      },
    });

    res.status(201).json({
      success: true,
      data: reservation,
      message: '预订创建成功',
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id/status', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('预订ID不能为空'),
  body('status').isIn([ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW]).withMessage('无效的状态'),
  body('reason').optional(),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;
    const user = req.user!;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: '预订记录不存在',
      });
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: '只有已确认的预订可以取消',
      });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        status,
      },
      include: {
        channel: true,
        guest: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_RESERVATION_STATUS',
        module: 'Reservation',
        targetType: 'Reservation',
        targetId: id,
        operatorId: user.id,
        operatorName: user.name,
        oldValue: JSON.parse(JSON.stringify(reservation)),
        newValue: JSON.parse(JSON.stringify(updatedReservation)),
      },
    });

    res.json({
      success: true,
      data: updatedReservation,
      message: '预订状态已更新',
    });
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id/assign-room', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('预订ID不能为空'),
  body('roomId').notEmpty().withMessage('房间ID不能为空'),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { roomId } = req.body;
    const user = req.user!;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: '预订记录不存在',
      });
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: '只能为已确认的预订分配房间',
      });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在',
      });
    }

    if (room.type !== reservation.roomType) {
      return res.status(400).json({
        success: false,
        message: '房间类型与预订房型不匹配',
      });
    }

    if (room.status !== 'VACANT') {
      return res.status(400).json({
        success: false,
        message: '房间状态不可用',
      });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        roomId,
      },
      include: {
        room: true,
        guest: true,
        channel: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ASSIGN_ROOM',
        module: 'Reservation',
        targetType: 'Reservation',
        targetId: id,
        operatorId: user.id,
        operatorName: user.name,
        newValue: JSON.parse(JSON.stringify(updatedReservation)),
      },
    });

    res.json({
      success: true,
      data: updatedReservation,
      message: '房间分配成功',
    });
  } catch (error) {
    console.error('Assign room error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
