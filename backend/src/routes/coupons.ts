import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('merchantId').exists(),
    body('title').isLength({ min: 1 }),
    body('discountType').isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y']),
    body('discountValue').isFloat({ min: 0 }),
    body('totalQuantity').isInt({ min: 1 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const merchant = await prisma.merchant.findUnique({
        where: { id: req.body.merchantId },
      });
      if (!merchant || merchant.userId !== req.userId) {
        return res.status(403).json({ error: '无权操作' });
      }

      const coupon = await prisma.coupon.create({
        data: {
          ...req.body,
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate),
        },
      });
      res.json({ coupon });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/merchant/:merchantId', async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        merchantId: req.params.merchantId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ coupons });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/claim', auth, async (req: AuthRequest, res) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: req.params.id },
    });
    if (!coupon) return res.status(404).json({ error: '优惠券不存在' });

    if (coupon.claimedQuantity >= coupon.totalQuantity) {
      return res.status(400).json({ error: '优惠券已领完' });
    }

    const existing = await prisma.userCoupon.findUnique({
      where: { userId_couponId: { userId: req.userId!, couponId: req.params.id } },
    });
    if (existing) {
      return res.status(400).json({ error: '已领取过此优惠券' });
    }

    const userCoupon = await prisma.$transaction(async tx => {
      await tx.coupon.update({
        where: { id: req.params.id },
        data: { claimedQuantity: { increment: 1 } },
      });
      return tx.userCoupon.create({
        data: { userId: req.userId!, couponId: req.params.id },
      });
    });

    res.json({ userCoupon });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/use', auth, async (req: AuthRequest, res) => {
  try {
    const userCoupon = await prisma.userCoupon.findFirst({
      where: {
        couponId: req.params.id,
        userId: req.userId,
        status: 'AVAILABLE',
      },
      include: { coupon: true },
    });

    if (!userCoupon) {
      return res.status(400).json({ error: '优惠券不可用' });
    }

    if (userCoupon.coupon.endDate < new Date()) {
      return res.status(400).json({ error: '优惠券已过期' });
    }

    const updated = await prisma.userCoupon.update({
      where: { id: userCoupon.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
      },
    });

    res.json({ userCoupon: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my/list', auth, async (req: AuthRequest, res) => {
  try {
    const coupons = await prisma.userCoupon.findMany({
      where: { userId: req.userId },
      include: { coupon: { include: { merchant: true } } },
      orderBy: { claimedAt: 'desc' },
    });
    res.json({ coupons });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
