import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { settlePartner, buildInviteTree } from '../services/commission.js';

const router = Router();

const applySchema = z.object({
  storeName: z.string().min(1).max(100),
  storeDescription: z.string().max(500).optional(),
  storeLogo: z.string().url().optional(),
  inviterCode: z.string().optional(),
  idCardVerified: z.boolean(),
  businessLicense: z.string().optional(),
});

const updateStoreSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  storeDescription: z.string().max(500).optional(),
  storeLogo: z.string().url().optional(),
});

router.post('/apply', authMiddleware, validate(applySchema), async (req, res, next) => {
  try {
    const existing = await prisma.partner.findFirst({ where: { userId: req.user!.id } });
    if (existing) {
      return res.status(409).json({ code: 409, message: 'Already a partner' });
    }

    const tenantId = req.tenant?.id ?? req.user!.tenantId;
    const { storeName, storeDescription, storeLogo, inviterCode, idCardVerified, businessLicense } = req.body;

    let inviterId: string | undefined;
    let invitePath = '';

    if (inviterCode) {
      const inviter = await prisma.partner.findUnique({ where: { partnerCode: inviterCode } });
      if (inviter && inviter.status === 'active') {
        inviterId = inviter.id;
        invitePath = inviter.invitePath ? `${inviter.invitePath}/${inviter.id}` : inviter.id;
      }
    }

    const partnerCode = `P${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const partner = await prisma.partner.create({
      data: {
        userId: req.user!.id,
        tenantId,
        partnerCode,
        storeName,
        storeLogo,
        storeDescription,
        level: 'bronze',
        status: 'pending',
        inviterId,
        invitePath,
        totalInvited: 0,
        totalSales: 0,
        totalCommission: 0,
        withdrawableCommission: 0,
        frozenCommission: 0,
        settledCommission: 0,
        joinedAt: new Date(),
        idCardVerified,
        businessLicense,
      },
    });

    if (inviterId) {
      await prisma.partner.update({
        where: { id: inviterId },
        data: { totalInvited: { increment: 1 } },
      });

      await prisma.partnerInviteRelation.create({
        data: {
          tenantId,
          ancestorId: inviterId,
          descendantId: partner.id,
          depth: 1,
        },
      });

      const inviter = await prisma.partner.findUnique({ where: { id: inviterId } });
      if (inviter?.invitePath) {
        const ancestorIds = inviter.invitePath.split('/').filter(Boolean);
        for (let i = 0; i < ancestorIds.length; i++) {
          await prisma.partnerInviteRelation.create({
            data: {
              tenantId,
              ancestorId: ancestorIds[i],
              descendantId: partner.id,
              depth: i + 2,
            },
          });
        }
      }
    }

    return res.status(201).json({ code: 0, data: partner });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findFirst({
      where: { userId: req.user!.id },
      include: { store: true },
    });

    if (!partner) {
      return res.status(404).json({ code: 404, message: 'Not a partner' });
    }

    return res.json({ code: 0, data: partner });
  } catch (error) {
    next(error);
  }
});

router.put('/me', authMiddleware, validate(updateStoreSchema), async (req, res, next) => {
  try {
    const partner = await prisma.partner.findFirst({
      where: { userId: req.user!.id },
      include: { store: true },
    });
    if (!partner) {
      return res.status(404).json({ code: 404, message: 'Not a partner' });
    }

    const { storeName, storeDescription, storeLogo } = req.body;

    await prisma.partner.update({
      where: { id: partner.id },
      data: {
        ...(storeName !== undefined && { storeName }),
        ...(storeDescription !== undefined && { storeDescription }),
        ...(storeLogo !== undefined && { storeLogo }),
      },
    });

    if (partner.store) {
      await prisma.partnerStore.update({
        where: { id: partner.store.id },
        data: {
          ...(storeName !== undefined && { name: storeName }),
          ...(storeDescription !== undefined && { description: storeDescription }),
          ...(storeLogo !== undefined && { logo: storeLogo }),
        },
      });
    }

    const updated = await prisma.partner.findFirst({
      where: { userId: req.user!.id },
      include: { store: true },
    });

    return res.json({ code: 0, data: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/me/commissions', authMiddleware, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findFirst({ where: { userId: req.user!.id } });
    if (!partner) {
      return res.status(404).json({ code: 404, message: 'Not a partner' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [commissions, total] = await Promise.all([
      prisma.commissionRecord.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.commissionRecord.count({ where: { partnerId: partner.id } }),
    ]);

    return res.json({ code: 0, data: { list: commissions, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/invites', authMiddleware, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findFirst({ where: { userId: req.user!.id } });
    if (!partner) {
      return res.status(404).json({ code: 404, message: 'Not a partner' });
    }

    const tree = await buildInviteTree(partner.id);
    return res.json({ code: 0, data: tree });
  } catch (error) {
    next(error);
  }
});

router.post('/me/settle', authMiddleware, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findFirst({ where: { userId: req.user!.id } });
    if (!partner) {
      return res.status(404).json({ code: 404, message: 'Not a partner' });
    }

    if (partner.status !== 'active') {
      return res.status(400).json({ code: 400, message: 'Partner is not active' });
    }

    const result = await settlePartner(partner.id);
    if (!result.success) {
      return res.status(400).json({ code: 400, message: 'Settlement failed' });
    }

    return res.json({ code: 0, data: { settledAmount: result.settledAmount } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/settlements', authMiddleware, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findFirst({ where: { userId: req.user!.id } });
    if (!partner) {
      return res.status(404).json({ code: 404, message: 'Not a partner' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [settlements, total] = await Promise.all([
      prisma.partnerSettlement.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.partnerSettlement.count({ where: { partnerId: partner.id } }),
    ]);

    return res.json({ code: 0, data: { list: settlements, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/stats', authMiddleware, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findFirst({ where: { userId: req.user!.id } });
    if (!partner) {
      return res.status(404).json({ code: 404, message: 'Not a partner' });
    }

    const [pendingCommissions, availableCommissions, recentOrders] = await Promise.all([
      prisma.commissionRecord.aggregate({
        where: { partnerId: partner.id, status: 'pending' },
        _sum: { commissionAmount: true },
      }),
      prisma.commissionRecord.aggregate({
        where: { partnerId: partner.id, status: 'available' },
        _sum: { commissionAmount: true },
      }),
      prisma.commissionRecord.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return res.json({
      code: 0,
      data: {
        totalSales: partner.totalSales,
        totalCommission: partner.totalCommission,
        withdrawableCommission: partner.withdrawableCommission,
        frozenCommission: partner.frozenCommission,
        pendingCommission: pendingCommissions._sum.commissionAmount ?? 0,
        availableCommission: availableCommissions._sum.commissionAmount ?? 0,
        totalInvited: partner.totalInvited,
        recentCommissions: recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
