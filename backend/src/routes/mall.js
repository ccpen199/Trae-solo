const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, sensitiveOperation } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

function generateRedemptionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { category, page = 1, pageSize = 12 } = req.query;

    const where = { stock: { gt: 0 } };
    if (category && category !== 'all') {
      where.category = category;
    }

    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      prisma.welfareProduct.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.welfareProduct.count({ where }),
    ]);

    const categories = await prisma.welfareProduct.groupBy({
      by: ['category'],
      _count: true,
    });

    res.json({
      products: products.map(p => ({
        ...p,
        targetAudienceRules: p.targetAudienceRules ? JSON.parse(p.targetAudienceRules) : [],
      })),
      categories: categories.map(c => ({
        name: c.category,
        count: c._count,
      })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

router.get('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.welfareProduct.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json({
      ...product,
      targetAudienceRules: product.targetAudienceRules ? JSON.parse(product.targetAudienceRules) : [],
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

router.post('/orders', authenticateToken, sensitiveOperation, auditLog('ORDER_CREATE', 'mall'), async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.welfareProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    const totalPrice = product.price * quantity;

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.welfareOrder.create({
        data: {
          userId: req.user.id,
          productId,
          quantity,
          totalPrice,
          status: 'completed',
        },
      });

      await tx.welfareProduct.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });

      const codes = [];
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + product.validityDays);

      for (let i = 0; i < quantity; i++) {
        let code;
        let exists = true;
        while (exists) {
          code = generateRedemptionCode();
          exists = await tx.redemptionCode.findUnique({ where: { code } });
        }

        const redemptionCode = await tx.redemptionCode.create({
          data: {
            code,
            orderId: createdOrder.id,
            productId,
            userId: req.user.id,
            expireAt,
          },
        });
        codes.push(redemptionCode);
      }

      return { ...createdOrder, redemptionCodes: codes };
    });

    res.json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.welfareOrder.findMany({
      where: { userId: req.user.id },
      include: {
        product: true,
        redemptionCodes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/codes', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const codes = await prisma.redemptionCode.findMany({
      where,
      include: { product: true, order: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(codes);
  } catch (error) {
    console.error('Get codes error:', error);
    res.status(500).json({ error: '获取核销码失败' });
  }
});

router.post('/redeem', authenticateToken, auditLog('CODE_REDEEM', 'mall'), async (req, res) => {
  try {
    const { code } = req.body;

    const redemptionCode = await prisma.redemptionCode.findUnique({
      where: { code },
      include: { product: true },
    });

    if (!redemptionCode) {
      return res.status(404).json({ error: '核销码不存在' });
    }

    if (redemptionCode.userId !== req.user.id) {
      return res.status(403).json({ error: '无权使用该核销码' });
    }

    if (redemptionCode.status !== 'active') {
      return res.status(400).json({ error: '核销码已使用或已过期' });
    }

    const now = new Date();
    if (redemptionCode.expireAt < now) {
      return res.status(400).json({ error: '核销码已过期' });
    }

    const redeemed = await prisma.redemptionCode.update({
      where: { code },
      data: {
        status: 'redeemed',
        redeemedAt: now,
      },
    });

    res.json({
      success: true,
      message: '核销成功',
      code: redeemed,
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: '核销失败' });
  }
});

router.get('/expire-soon', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringCodes = await prisma.redemptionCode.findMany({
      where: {
        userId: req.user.id,
        status: 'active',
        expireAt: {
          lte: sevenDaysLater,
          gt: now,
        },
      },
      include: { product: true },
      orderBy: { expireAt: 'asc' },
    });

    if (expiringCodes.length > 0) {
      const autoExpireProducts = await prisma.welfareProduct.findMany({
        where: { autoExpire: true },
        select: { id: true },
      });
      const autoExpireIds = autoExpireProducts.map(p => p.id);

      await prisma.redemptionCode.updateMany({
        where: {
          userId: req.user.id,
          status: 'active',
          productId: { in: autoExpireIds },
          expireAt: { lt: now },
        },
        data: { status: 'expired' },
      });
    }

    res.json(expiringCodes);
  } catch (error) {
    console.error('Get expiring codes error:', error);
    res.status(500).json({ error: '获取即将过期码失败' });
  }
});

module.exports = router;
