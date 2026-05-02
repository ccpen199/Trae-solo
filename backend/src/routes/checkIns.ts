import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { checkInEngine, CheckInData, CheckOutData } from '../engines/checkInEngine';

const router = Router();

router.use(authenticate);

router.get('/in-house', async (req: AuthRequest, res: Response) => {
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        actualCheckOutTime: null,
      },
      include: {
        room: true,
        guest: true,
        reservation: {
          include: { channel: true },
        },
      },
      orderBy: { checkInTime: 'desc' },
    });

    res.json({
      success: true,
      data: checkIns,
    });
  } catch (error) {
    console.error('Get in-house guests error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 20, guestName, roomNumber } = req.query;

    const where: any = {};
    if (guestName) {
      where.guest = {
        name: {
          contains: guestName as string,
        },
      };
    }
    if (roomNumber) {
      where.room = {
        roomNumber: {
          contains: roomNumber as string,
        },
      };
    }

    const total = await prisma.checkIn.count({ where });

    const checkIns = await prisma.checkIn.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
      orderBy: { checkInTime: 'desc' },
      include: {
        room: true,
        guest: true,
        reservation: {
          include: { channel: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        checkIns,
        pagination: {
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string)),
        },
      },
    });
  } catch (error) {
    console.error('Get check-ins error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      include: {
        room: true,
        guest: true,
        reservation: {
          include: { channel: true },
        },
      },
    });

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: '入住记录不存在',
      });
    }

    res.json({
      success: true,
      data: checkIn,
    });
  } catch (error) {
    console.error('Get check-in error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', requireRoles('ADMIN', 'FRONT_DESK'), [
  body('roomId').notEmpty().withMessage('房间ID不能为空'),
  body('guest.name').notEmpty().withMessage('客人姓名不能为空'),
  body('guest.phone').optional(),
  body('guest.idCardNumber').optional(),
  body('reservationId').optional(),
  body('expectedCheckOutTime').isISO8601().withMessage('预计退房时间格式无效'),
  body('adultCount').isInt({ min: 1 }).withMessage('成人数量必须为正整数'),
  body('childCount').optional().isInt({ min: 0 }).withMessage('儿童数量不能为负数'),
  body('depositAmount').optional().isDecimal({ min: '0' }).withMessage('押金不能为负数'),
  body('idCardVerified').optional().isBoolean(),
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

    const user = req.user!;
    const checkInData: CheckInData = {
      ...req.body,
      operatorId: user.id,
      operatorName: user.name,
    };

    const result = await checkInEngine.processCheckIn(checkInData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result,
      message: '入住办理成功',
    });
  } catch (error) {
    console.error('Process check-in error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/check-out', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('入住ID不能为空'),
  body('payments').optional().isArray(),
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
    const user = req.user!;
    const { payments } = req.body;

    const checkOutData: CheckOutData = {
      checkInId: id,
      payments: payments || [],
      operatorId: user.id,
      operatorName: user.name,
    };

    const result = await checkInEngine.processCheckOut(checkOutData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result,
      message: '退房办理成功',
    });
  } catch (error) {
    console.error('Process check-out error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
