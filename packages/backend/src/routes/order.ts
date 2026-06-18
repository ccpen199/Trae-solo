import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { distributeCommission } from '../services/commission.js';

const router = Router();

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    skuId: z.string().optional(),
    quantity: z.number().int().positive(),
  })).min(1),
  deliveryType: z.enum(['delivery', 'pickup']),
  pickupPointId: z.string().optional(),
  deliveryAddress: z.object({
    receiverName: z.string(),
    receiverPhone: z.string(),
    province: z.string(),
    city: z.string(),
    district: z.string(),
    address: z.string(),
    postalCode: z.string().optional(),
  }).optional(),
  redpacketId: z.string().optional(),
  remark: z.string().optional(),
});

const payOrderSchema = z.object({
  paymentMethod: z.enum(['wechat', 'alipay', 'balance']),
});

router.post('/', authMiddleware, validate(createOrderSchema), async (req, res, next) => {
  try {
    const { items, deliveryType, pickupPointId, deliveryAddress, redpacketId, remark } = req.body;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    let totalAmount = 0;
    let discountAmount = 0;
    const orderItems: { productId: string; skuId?: string; productName: string; productImage: string; specs?: Record<string, string>; quantity: number; unitPrice: number; amount: number }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status !== 'on_sale') {
        return res.status(400).json({ code: 400, message: `Product ${item.productId} not available` });
      }

      let unitPrice = product.price;
      let specs: Record<string, string> | undefined;

      if (item.skuId) {
        const sku = await prisma.productSku.findUnique({ where: { id: item.skuId } });
        if (!sku || sku.status !== 'active') {
          return res.status(400).json({ code: 400, message: `SKU ${item.skuId} not available` });
        }
        unitPrice = sku.price;
        specs = sku.specs as Record<string, string>;
      }

      const amount = unitPrice * item.quantity;
      totalAmount += amount;

      orderItems.push({
        productId: item.productId,
        skuId: item.skuId,
        productName: product.name,
        productImage: product.mainImage,
        specs,
        quantity: item.quantity,
        unitPrice,
        amount,
      });
    }

    let redpacketAmount = 0;
    if (redpacketId) {
      const redpacket = await prisma.redPacket.findFirst({
        where: { id: redpacketId, userId: req.user!.id, status: 'unused' },
      });
      if (redpacket) {
        redpacketAmount = Math.min(redpacket.remainingAmount, totalAmount - discountAmount);
      }
    }

    const shippingFee = 0;
    const payAmount = totalAmount - discountAmount - redpacketAmount + shippingFee;

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNo,
        tenantId,
        userId: req.user!.id,
        orderType: 'product',
        totalAmount,
        discountAmount,
        shippingFee,
        redpacketAmount,
        payAmount,
        paymentStatus: 'unpaid',
        status: 'pending_payment',
        remark,
        deliveryType,
        pickupPointId,
        deliveryAddress: deliveryAddress ?? undefined,
      },
    });

    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          ...item,
        },
      });
    }

    if (redpacketId && redpacketAmount > 0) {
      await prisma.redPacket.update({
        where: { id: redpacketId },
        data: { status: 'used', usedAt: new Date(), usedOrderId: order.id },
      });
    }

    return res.status(201).json({ code: 0, data: order });
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: orders, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, payments: true },
    });

    if (!order || (order.userId !== req.user!.id && req.user!.role !== 'tenant_admin' && req.user!.role !== 'platform_admin')) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    return res.json({ code: 0, data: order });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pay', authMiddleware, validate(payOrderSchema), async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.userId !== req.user!.id) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    if (order.status !== 'pending_payment') {
      return res.status(400).json({ code: 400, message: 'Order is not in pending payment state' });
    }

    if (paymentMethod === 'balance') {
      const wallet = await prisma.userWallet.findUnique({ where: { userId: req.user!.id } });
      if (!wallet || wallet.balance < order.payAmount) {
        return res.status(400).json({ code: 400, message: 'Insufficient balance' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.userWallet.update({
          where: { userId: req.user!.id },
          data: {
            balance: { decrement: order.payAmount },
            totalWithdraw: { increment: order.payAmount },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: req.user!.id,
            amount: -order.payAmount,
            balanceAfter: wallet.balance - order.payAmount,
            type: 'expense',
            source: 'payment',
            sourceId: order.id,
            description: `Order payment: ${order.orderNo}`,
          },
        });

        await tx.paymentRecord.create({
          data: {
            orderId: order.id,
            userId: req.user!.id,
            amount: order.payAmount,
            method: 'balance',
            status: 'paid',
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentMethod: 'balance',
            paymentStatus: 'paid',
            paidAt: new Date(),
            status: 'paid',
          },
        });
      });
    } else {
      await prisma.paymentRecord.create({
        data: {
          orderId: order.id,
          userId: req.user!.id,
          amount: order.payAmount,
          method: paymentMethod,
          status: 'paid',
          paidAt: new Date(),
          thirdPartyTradeNo: `MOCK_${Date.now()}`,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentMethod,
          paymentStatus: 'paid',
          paidAt: new Date(),
          status: 'paid',
        },
      });
    }

    await distributeCommission(req.params.id).catch(() => {});

    return res.json({ code: 0, data: { status: 'paid' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.userId !== req.user!.id) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    if (!['pending_payment', 'paid'].includes(order.status)) {
      return res.status(400).json({ code: 400, message: 'Order cannot be cancelled in current state' });
    }

    await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: 'User cancelled',
      },
    });

    return res.json({ code: 0, data: { status: 'cancelled' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/confirm', authMiddleware, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.userId !== req.user!.id) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    if (order.status !== 'delivered' && order.status !== 'pending_pickup') {
      return res.status(400).json({ code: 400, message: 'Order cannot be confirmed in current state' });
    }

    await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return res.json({ code: 0, data: { status: 'completed' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/refund', authMiddleware, async (req, res, next) => {
  try {
    const { reason, description, evidenceImages } = req.body as { reason: string; description?: string; evidenceImages?: string[] };

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.userId !== req.user!.id) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    if (!['paid', 'delivered', 'pending_pickup', 'completed'].includes(order.status)) {
      return res.status(400).json({ code: 400, message: 'Refund not available for current order state' });
    }

    const refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        userId: req.user!.id,
        amount: order.payAmount,
        reason,
        description,
        evidenceImages,
        status: 'pending',
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'refunding' },
    });

    return res.status(201).json({ code: 0, data: refund });
  } catch (error) {
    next(error);
  }
});

export default router;
