import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { BillStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { billingEngine, BillItemData, PaymentData } from '../engines/billingEngine';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, guestName, page = 1, pageSize = 20 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const total = await prisma.bill.count({ where });

    const bills = await prisma.bill.findMany({
      where,
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
      orderBy: { createdAt: 'desc' },
      include: {
        guest: true,
        reservation: true,
        checkIn: {
          include: { room: true },
        },
        _count: {
          select: { items: true, payments: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string)),
        },
      },
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const billSummary = await billingEngine.getBillSummary(id);

    if (!billSummary) {
      return res.status(404).json({
        success: false,
        message: '账单不存在',
      });
    }

    res.json({
      success: true,
      data: billSummary,
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/items', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('账单ID不能为空'),
  body('itemType').notEmpty().withMessage('项目类型不能为空'),
  body('description').notEmpty().withMessage('项目描述不能为空'),
  body('quantity').isInt({ min: 1 }).withMessage('数量必须为正整数'),
  body('unitPrice').isDecimal({ min: '0' }).withMessage('单价不能为负数'),
  body('remark').optional(),
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

    const itemData: BillItemData = {
      ...req.body,
      operatorId: user.id,
      operatorName: user.name,
    };

    const result = await billingEngine.addBillItem(id, itemData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result,
      message: '账单项目添加成功',
    });
  } catch (error) {
    console.error('Add bill item error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/payments', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('账单ID不能为空'),
  body('paymentMethod').notEmpty().withMessage('支付方式不能为空'),
  body('amount').isDecimal({ min: '0' }).withMessage('支付金额不能为负数'),
  body('transactionNo').optional(),
  body('remark').optional(),
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

    const paymentData: PaymentData = {
      ...req.body,
      operatorId: user.id,
      operatorName: user.name,
    };

    const result = await billingEngine.processPayment(id, paymentData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result,
      message: '支付记录添加成功',
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/discount', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('账单ID不能为空'),
  body('discountAmount').isDecimal({ min: '0' }).withMessage('折扣金额不能为负数'),
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
    const { discountAmount } = req.body;
    const user = req.user!;

    const result = await billingEngine.applyDiscount(id, discountAmount, user.id, user.name);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result,
      message: '折扣应用成功',
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/settle', requireRoles('ADMIN', 'FRONT_DESK'), [
  param('id').notEmpty().withMessage('账单ID不能为空'),
  body('payments').isArray().withMessage('支付信息必须为数组'),
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
    const { payments } = req.body;
    const user = req.user!;

    const result = await billingEngine.settleBill(id, payments, user.id, user.name);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result,
      message: '账单结算成功',
    });
  } catch (error) {
    console.error('Settle bill error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetType: 'Bill',
        targetId: id,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: auditLogs,
    });
  } catch (error) {
    console.error('Get bill history error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;
