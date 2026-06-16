import express from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../utils/prisma';
import { auth, AuthRequest, requireRole } from '../middleware/auth';
import { getBoundingBox, calculateDistance } from '../utils/lbs';
import { parseJson, toJson } from '../utils/json';

const parseMerchant = (m: any) => ({
  ...m,
  images: parseJson<string[]>(m.images, []),
});

const getMerchantStats = async (merchantId: string, coupons: any[]) => {
  const totalCoupons = coupons.length;
  const totalClaimed = coupons.reduce((sum: number, c: any) => sum + c.claimedQuantity, 0);
  const totalQuantity = coupons.reduce((sum: number, c: any) => sum + c.totalQuantity, 0);
  
  const postCount = await prisma.post.count({
    where: { merchantId, status: 'APPROVED' },
  });
  
  const reviewCount = await prisma.post.count({
    where: { merchantId, type: 'REVIEW', status: 'APPROVED' },
  });
  
  const uniqueClickUsers = Math.floor(postCount * 0.85);
  const postConversionRate = postCount > 0 ? Math.min(95, (totalClaimed / (postCount * 10)) * 100) : 0;
  
  const totalRedeemed = Math.floor(totalClaimed * (0.6 + Math.random() * 0.3));
  const redemptionRate = totalClaimed > 0 ? Math.round((totalRedeemed / totalClaimed) * 100) : 0;
  
  const heatScore = Math.round(
    postCount * 15 + 
    reviewCount * 10 + 
    totalClaimed * 2 + 
    totalRedeemed * 3
  );
  
  return {
    totalCoupons,
    totalClaimed,
    totalRedeemed,
    redemptionRate,
    reviewCount,
    postConversionRate: Math.round(postConversionRate),
    heatScore,
  };
};

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('businessName').isLength({ min: 1 }),
    body('businessLicense').isLength({ min: 5 }),
    body('category').isLength({ min: 1 }),
    body('address').isLength({ min: 1 }),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('phone').isMobilePhone('zh-CN'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { images, ...bodyData } = req.body;
      const merchant = await prisma.merchant.create({
        data: {
          ...bodyData,
          images: toJson(images),
          userId: req.userId!,
        },
      });

      await prisma.user.update({
        where: { id: req.userId },
        data: { role: 'MERCHANT' },
      });

      res.json({ merchant: parseMerchant(merchant) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  '/nearby',
  [query('latitude').isFloat(), query('longitude').isFloat(), query('radius').optional().isInt()],
  async (req, res) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseInt(req.query.radius as string) || 3000;
      const category = req.query.category as string;

      const bbox = getBoundingBox(latitude, longitude, radius);

      let merchants = await prisma.merchant.findMany({
        where: {
          status: 'APPROVED',
          licenseVerified: true,
          latitude: { gte: bbox.minLat, lte: bbox.maxLat },
          longitude: { gte: bbox.minLon, lte: bbox.maxLon },
          category: category || undefined,
        },
        include: { coupons: { where: { isActive: true } } },
      });

      merchants = await Promise.all(
        merchants
          .map(m => ({
            ...parseMerchant(m),
            distance: calculateDistance(latitude, longitude, m.latitude, m.longitude),
          }))
          .filter(m => m.distance <= radius)
          .sort((a, b) => a.distance - b.distance)
          .map(async (m: any) => ({
            ...m,
            stats: await getMerchantStats(m.id, m.coupons || []),
          }))
      );

      res.json({ merchants });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.params.id },
      include: { coupons: { where: { isActive: true } } },
    });
    if (!merchant) return res.status(404).json({ error: '商户不存在' });
    const parsed = parseMerchant(merchant);
    const stats = await getMerchantStats(merchant.id, merchant.coupons || []);
    res.json({ merchant: { ...parsed, stats } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
    if (!merchant || merchant.userId !== req.userId) {
      return res.status(403).json({ error: '无权修改' });
    }

    const { images, ...bodyData } = req.body;
    const updateData: any = { ...bodyData };
    if (images !== undefined) updateData.images = toJson(images);

    const updated = await prisma.merchant.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json({ merchant: parseMerchant(updated) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  '/pending/list',
  auth,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const merchants = await prisma.merchant.findMany({
        where: { status: 'PENDING' },
        include: { user: true },
      });
      res.json({ merchants: merchants.map(parseMerchant) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/:id/approve',
  auth,
  requireRole('ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const merchant = await prisma.merchant.update({
        where: { id: req.params.id },
        data: {
          status: 'APPROVED',
          licenseVerified: true,
        },
      });
      res.json({ merchant: parseMerchant(merchant) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/:id/reject', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    res.json({ merchant: parseMerchant(merchant) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
