import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { holdPayment, releasePayment, refundPayment } from '../services/escrow.js';

const router = Router();

const createListingSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(5000),
  category: z.string().min(1),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  images: z.array(z.string().url()).min(1),
  locationName: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }).optional(),
  allowDelivery: z.boolean().default(false),
  allowMeetup: z.boolean().default(true),
  meetupLocation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateListingSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  images: z.array(z.string().url()).optional(),
  allowDelivery: z.boolean().optional(),
  allowMeetup: z.boolean().optional(),
  meetupLocation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'on_sale', 'deleted']).optional(),
});

const buySchema = z.object({
  deliveryType: z.enum(['delivery', 'meetup']),
  paymentMethod: z.enum(['wechat', 'alipay']),
  buyerNotes: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const category = req.query.category as string | undefined;

    const tenantId = req.tenant?.id;
    const where: Record<string, unknown> = { status: 'on_sale' };
    if (tenantId) where.tenantId = tenantId;
    if (category) where.category = category;

    const [listings, total] = await Promise.all([
      prisma.secondhandListing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.secondhandListing.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: listings, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, validate(createListingSchema), async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const listing = await prisma.secondhandListing.create({
      data: {
        tenantId,
        sellerId: req.user!.id,
        ...req.body,
        status: 'on_sale',
        viewCount: 0,
        favoriteCount: 0,
        reportCount: 0,
      },
    });

    return res.status(201).json({ code: 0, data: listing });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const listing = await prisma.secondhandListing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing || listing.status === 'deleted') {
      return res.status(404).json({ code: 404, message: 'Listing not found' });
    }

    await prisma.secondhandListing.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    return res.json({ code: 0, data: listing });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, validate(updateListingSchema), async (req, res, next) => {
  try {
    const listing = await prisma.secondhandListing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      return res.status(404).json({ code: 404, message: 'Listing not found' });
    }

    if (listing.sellerId !== req.user!.id) {
      return res.status(403).json({ code: 403, message: 'Not your listing' });
    }

    const updated = await prisma.secondhandListing.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return res.json({ code: 0, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const listing = await prisma.secondhandListing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      return res.status(404).json({ code: 404, message: 'Listing not found' });
    }

    if (listing.sellerId !== req.user!.id) {
      return res.status(403).json({ code: 403, message: 'Not your listing' });
    }

    await prisma.secondhandListing.update({
      where: { id: req.params.id },
      data: { status: 'deleted' },
    });

    return res.json({ code: 0, data: null });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/favorite', authMiddleware, async (req, res, next) => {
  try {
    const existing = await prisma.secondhandFavorite.findUnique({
      where: { listingId_userId: { listingId: req.params.id, userId: req.user!.id } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.secondhandFavorite.delete({ where: { id: existing.id } }),
        prisma.secondhandListing.update({ where: { id: req.params.id }, data: { favoriteCount: { decrement: 1 } } }),
      ]);
      return res.json({ code: 0, data: { favorited: false } });
    }

    await prisma.$transaction([
      prisma.secondhandFavorite.create({
        data: { listingId: req.params.id, userId: req.user!.id },
      }),
      prisma.secondhandListing.update({ where: { id: req.params.id }, data: { favoriteCount: { increment: 1 } } }),
    ]);

    return res.json({ code: 0, data: { favorited: true } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/buy', authMiddleware, validate(buySchema), async (req, res, next) => {
  try {
    const listing = await prisma.secondhandListing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.status !== 'on_sale') {
      return res.status(404).json({ code: 404, message: 'Listing not available' });
    }

    if (listing.sellerId === req.user!.id) {
      return res.status(400).json({ code: 400, message: 'Cannot buy your own listing' });
    }

    const { deliveryType, paymentMethod, buyerNotes } = req.body;
    const serviceFee = Math.round(listing.price * 0.02 * 100) / 100;
    const totalAmount = listing.price + serviceFee;
    const sellerReceiveAmount = listing.price;
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const order = await prisma.secondhandOrder.create({
      data: {
        orderNo: `SH${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        tenantId,
        listingId: listing.id,
        buyerId: req.user!.id,
        sellerId: listing.sellerId,
        price: listing.price,
        serviceFee,
        totalAmount,
        sellerReceiveAmount,
        paymentMethod,
        paymentStatus: 'unpaid',
        status: 'pending_payment',
        deliveryType,
        buyerNotes,
      },
    });

    await prisma.secondhandListing.update({
      where: { id: listing.id },
      data: { status: 'reserved' },
    });

    const holdResult = await holdPayment(order.id, totalAmount);
    if (!holdResult.success) {
      await prisma.secondhandListing.update({
        where: { id: listing.id },
        data: { status: 'on_sale' },
      });
      return res.status(400).json({ code: 400, message: holdResult.error ?? 'Payment hold failed' });
    }

    return res.status(201).json({ code: 0, data: order });
  } catch (error) {
    next(error);
  }
});

router.post('/secondhand-orders/:id/confirm-receipt', authMiddleware, async (req, res, next) => {
  try {
    const order = await prisma.secondhandOrder.findUnique({ where: { id: req.params.id } });
    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    if (order.buyerId !== req.user!.id) {
      return res.status(403).json({ code: 403, message: 'Not the buyer' });
    }

    if (order.status !== 'paid_held' && order.status !== 'buyer_confirmed') {
      return res.status(400).json({ code: 400, message: 'Order cannot be confirmed in current state' });
    }

    const releaseResult = await releasePayment(order.id);
    if (!releaseResult.success) {
      return res.status(400).json({ code: 400, message: releaseResult.error ?? 'Release failed' });
    }

    return res.json({ code: 0, data: { status: 'completed' } });
  } catch (error) {
    next(error);
  }
});

router.post('/secondhand-orders/:id/dispute', authMiddleware, async (req, res, next) => {
  try {
    const { reason } = req.body as { reason: string };

    const order = await prisma.secondhandOrder.findUnique({ where: { id: req.params.id } });
    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id) {
      return res.status(403).json({ code: 403, message: 'Not involved in this order' });
    }

    await prisma.secondhandOrder.update({
      where: { id: order.id },
      data: {
        status: 'dispute',
        disputeReason: reason,
      },
    });

    return res.json({ code: 0, data: { status: 'dispute' } });
  } catch (error) {
    next(error);
  }
});

router.get('/secondhand-orders', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [orders, total] = await Promise.all([
      prisma.secondhandOrder.findMany({
        where: {
          OR: [{ buyerId: req.user!.id }, { sellerId: req.user!.id }],
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.secondhandOrder.count({
        where: {
          OR: [{ buyerId: req.user!.id }, { sellerId: req.user!.id }],
        },
      }),
    ]);

    return res.json({ code: 0, data: { list: orders, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

export default router;
