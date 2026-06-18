import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  email: z.string().email().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthday: z.string().datetime().optional(),
  signature: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
});

const verifySchema = z.object({
  realName: z.string().min(1, 'Real name is required'),
  idCardType: z.enum(['id_card', 'passport', 'hk_macau', 'taiwan']),
  idCardNumber: z.string().min(1, 'ID card number is required'),
  idCardFrontImage: z.string().url(),
  idCardBackImage: z.string().url(),
  faceImage: z.string().url().optional(),
});

const bindHouseholdSchema = z.object({
  buildingId: z.string().min(1),
  roomNo: z.string().min(1),
  householdType: z.enum(['owner', 'tenant', 'family']),
  relationship: z.string().optional(),
});

const bindAccessCardSchema = z.object({
  cardNumber: z.string().min(1),
  cardType: z.enum(['physical', 'virtual', 'nfc', 'ble']),
  deviceId: z.string().optional(),
});

router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    return res.json({ code: 0, data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authMiddleware, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { nickname, avatar, email, gender, birthday, signature, tags } = req.body;

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
        ...(email !== undefined && { email }),
      },
    });

    const profileData: Record<string, unknown> = {};
    if (gender !== undefined) profileData.gender = gender;
    if (birthday !== undefined) profileData.birthday = new Date(birthday);
    if (signature !== undefined) profileData.signature = signature;
    if (tags !== undefined) profileData.tags = tags;

    if (Object.keys(profileData).length > 0) {
      await prisma.userProfile.upsert({
        where: { userId: req.user!.id },
        update: profileData,
        create: { userId: req.user!.id, ...profileData },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true },
    });

    return res.json({ code: 0, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', authMiddleware, validate(verifySchema), async (req, res, next) => {
  try {
    const { realName, idCardType, idCardNumber, idCardFrontImage, idCardBackImage, faceImage } = req.body;

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        realName,
        idCardType,
        idCardNumber,
        idCardFrontImage,
        idCardBackImage,
        faceImage,
        verificationStatus: 'pending',
      },
    });

    return res.json({ code: 0, data: { verificationStatus: 'pending' } });
  } catch (error) {
    next(error);
  }
});

router.get('/households', authMiddleware, async (req, res, next) => {
  try {
    const households = await prisma.household.findMany({
      where: { userId: req.user!.id },
      include: { building: true },
    });

    return res.json({ code: 0, data: households });
  } catch (error) {
    next(error);
  }
});

router.post('/households', authMiddleware, validate(bindHouseholdSchema), async (req, res, next) => {
  try {
    const { buildingId, roomNo, householdType, relationship } = req.body;

    const existing = await prisma.household.findFirst({
      where: { userId: req.user!.id, buildingId, roomNo },
    });

    if (existing) {
      return res.status(409).json({ code: 409, message: 'Already bound to this household' });
    }

    const household = await prisma.household.create({
      data: {
        userId: req.user!.id,
        tenantId: req.user!.tenantId,
        buildingId,
        roomNo,
        householdType,
        relationship,
        isPrimary: false,
      },
    });

    return res.status(201).json({ code: 0, data: household });
  } catch (error) {
    next(error);
  }
});

router.get('/access-cards', authMiddleware, async (req, res, next) => {
  try {
    const cards = await prisma.accessCard.findMany({
      where: { userId: req.user!.id },
    });

    return res.json({ code: 0, data: cards });
  } catch (error) {
    next(error);
  }
});

router.post('/access-cards', authMiddleware, validate(bindAccessCardSchema), async (req, res, next) => {
  try {
    const { cardNumber, cardType, deviceId } = req.body;

    const existing = await prisma.accessCard.findFirst({
      where: { cardNumber, status: 'active' },
    });

    if (existing) {
      return res.status(409).json({ code: 409, message: 'Access card already bound' });
    }

    const card = await prisma.accessCard.create({
      data: {
        userId: req.user!.id,
        tenantId: req.user!.tenantId,
        cardNumber,
        cardType,
        deviceId,
        status: 'active',
      },
    });

    return res.status(201).json({ code: 0, data: card });
  } catch (error) {
    next(error);
  }
});

router.get('/access-records', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [records, total] = await Promise.all([
      prisma.accessRecord.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.accessRecord.count({ where: { userId: req.user!.id } }),
    ]);

    return res.json({ code: 0, data: { list: records, total, page, pageSize } });
  } catch (error) {
    next(error);
  }
});

export default router;
