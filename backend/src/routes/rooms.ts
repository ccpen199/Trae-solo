import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { RoomStatus, RoomType } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { roomStatusEngine } from '../engines/roomStatusEngine';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, floor, type } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (floor) {
      where.floor = parseInt(floor as string);
    }
    if (type) {
      where.type = type;
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      include: {
        checkIns: {
          where: { actualCheckOutTime: null },
          include: { guest: true },
          take: 1,
        },
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          include: { guest: true },
        },
      },
    });

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/status-summary', async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      select: { status: true },
    });

    const summary = {
      total: rooms.length,
      vacant: 0,
      occupied: 0,
      dirty: 0,
      maintenance: 0,
      reserved: 0,
    };

    for (const room of rooms) {
      switch (room.status) {
        case RoomStatus.VACANT:
          summary.vacant++;
          break;
        case RoomStatus.OCCUPIED:
          summary.occupied++;
          break;
        case RoomStatus.DIRTY:
          summary.dirty++;
          break;
        case RoomStatus.MAINTENANCE:
          summary.maintenance++;
          break;
        case RoomStatus.RESERVED:
          summary.reserved++;
          break;
      }
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get status summary error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        checkIns: {
          include: { guest: true },
          orderBy: { checkInTime: 'desc' },
          take: 10,
        },
        cleanTasks: {
          include: { assignee: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在',
      });
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id/status', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('房间ID不能为空'),
  body('status').isIn(Object.values(RoomStatus)).withMessage('无效的房间状态'),
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

    const result = await roomStatusEngine.changeStatus({
      roomId: id,
      newStatus: status,
      operatorId: user.id,
      operatorName: user.name,
      reason,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const updatedRoom = await prisma.room.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      data: updatedRoom,
      message: '房间状态已更新',
    });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', requireRoles('ADMIN'), [
  body('roomNumber').notEmpty().withMessage('房号不能为空'),
  body('floor').isInt({ min: 1 }).withMessage('楼层必须为正整数'),
  body('type').isIn(Object.values(RoomType)).withMessage('无效的房型'),
  body('basePrice').isDecimal({ min: '0' }).withMessage('基础价格必须为正数'),
  body('maxGuests').optional().isInt({ min: 1 }).withMessage('最大客人数必须为正整数'),
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

    const { roomNumber, floor, type, basePrice, maxGuests, description, amenities } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { roomNumber },
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: '房号已存在',
      });
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        floor,
        type,
        basePrice,
        maxGuests: maxGuests || 2,
        description,
        amenities: amenities || [],
      },
    });

    res.status(201).json({
      success: true,
      data: room,
      message: '房间创建成功',
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.put('/:id', requireRoles('ADMIN'), [
  param('id').notEmpty().withMessage('房间ID不能为空'),
  body('floor').optional().isInt({ min: 1 }).withMessage('楼层必须为正整数'),
  body('type').optional().isIn(Object.values(RoomType)).withMessage('无效的房型'),
  body('basePrice').optional().isDecimal({ min: '0' }).withMessage('基础价格必须为正数'),
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
    const { floor, type, basePrice, maxGuests, description, amenities } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: '房间不存在',
      });
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        floor,
        type,
        basePrice,
        maxGuests,
        description,
        amenities,
      },
    });

    res.json({
      success: true,
      data: room,
      message: '房间更新成功',
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.delete('/:id', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在',
      });
    }

    if (room.status !== RoomStatus.VACANT) {
      return res.status(400).json({
        success: false,
        message: '只有空闲房间可以删除',
      });
    }

    await prisma.room.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '房间删除成功',
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const history = await roomStatusEngine.getStatusHistory(id, parseInt(limit as string));

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get room history error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
