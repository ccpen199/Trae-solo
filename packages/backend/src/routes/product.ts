import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createProductSchema = z.object({
  categoryId: z.string().min(1),
  productType: z.enum(['self_operated', 'third_party', 'partner']),
  partnerId: z.string().optional(),
  name: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  description: z.string().min(1),
  images: z.array(z.string().url()).min(1),
  mainImage: z.string().url(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().nonnegative(),
  unit: z.string().default('件'),
  weight: z.number().positive().optional(),
  isFreeShipping: z.boolean().default(true),
  shippingFee: z.number().nonnegative().optional(),
  deliveryRadiusKm: z.number().positive().optional(),
  deliveryTypes: z.array(z.enum(['self_pickup', 'warehouse_delivery', 'property_pickup'])),
  pickupPoints: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().int().default(0),
  isRecommend: z.boolean().default(false),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(200).optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  mainImage: z.string().url().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  isFreeShipping: z.boolean().optional(),
  shippingFee: z.number().nonnegative().optional(),
  deliveryTypes: z.array(z.enum(['self_pickup', 'warehouse_delivery', 'property_pickup'])).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'on_sale', 'off_sale', 'sold_out']).optional(),
  sortOrder: z.number().int().optional(),
  isRecommend: z.boolean().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const categoryId = req.query.categoryId as string | undefined;
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined;

    const tenantId = req.tenant?.id;
    const where: Record<string, unknown> = { status: 'on_sale' };
    if (tenantId) where.tenantId = tenantId;
    if (categoryId) where.categoryId = categoryId;

    if (radiusKm && req.tenant?.location) {
      const tenantLocation = req.tenant.location as { lat: number; lng: number };
      where.deliveryRadiusKm = { gte: radiusKm };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({ code: 0, data: { list: products, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { skus: { where: { status: 'active' } } },
    });

    if (!product || product.status === 'deleted') {
      return res.status(404).json({ code: 404, message: 'Product not found' });
    }

    return res.json({ code: 0, data: product });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, requireRole('tenant_admin', 'platform_admin'), validate(createProductSchema), async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id ?? req.user!.tenantId;

    const product = await prisma.product.create({
      data: {
        tenantId,
        ...req.body,
      },
    });

    return res.status(201).json({ code: 0, data: product });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, requireRole('tenant_admin', 'platform_admin'), validate(updateProductSchema), async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ code: 404, message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return res.json({ code: 0, data: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/skus', async (req, res, next) => {
  try {
    const skus = await prisma.productSku.findMany({
      where: { productId: req.params.id, status: 'active' },
    });

    return res.json({ code: 0, data: skus });
  } catch (error) {
    next(error);
  }
});

router.get('/warehouses', async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const where = tenantId ? { tenantId, status: 'active' } : { status: 'active' };

    const warehouses = await prisma.warehouse.findMany({ where });
    return res.json({ code: 0, data: warehouses });
  } catch (error) {
    next(error);
  }
});

router.get('/pickup-points', async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const where = tenantId ? { tenantId, status: 'active' } : { status: 'active' };

    const pickupPoints = await prisma.pickupPoint.findMany({ where });
    return res.json({ code: 0, data: pickupPoints });
  } catch (error) {
    next(error);
  }
});

router.get('/inventory/:productId', async (req, res, next) => {
  try {
    const inventory = await prisma.inventoryRecord.findMany({
      where: { productId: req.params.productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ code: 0, data: inventory });
  } catch (error) {
    next(error);
  }
});

export default router;
