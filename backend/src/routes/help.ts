import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { auth, AuthRequest } from '../middleware/auth';
import { getBoundingBox, calculateDistance } from '../utils/lbs';
import { parseJson, toJson } from '../utils/json';

const parseHelpImages = (item: any) => {
  if (!item) return item;
  return {
    ...item,
    images: parseJson<string[]>(item.images, []),
  };
};

const router = express.Router();

router.post(
  '/requests',
  auth,
  [
    body('type').isIn(['SECOND_HAND', 'SKILL_EXCHANGE', 'EMERGENCY', 'OTHER']),
    body('title').isLength({ min: 1 }),
    body('content').isLength({ min: 1 }),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('locationName').exists(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { images, ...bodyData } = req.body;
      const helpRequest = await prisma.helpRequest.create({
        data: {
          ...bodyData,
          images: toJson(images),
          userId: req.userId!,
        },
        include: { user: { select: { id: true, nickname: true, avatar: true } } },
      });
      res.json({ helpRequest: parseHelpImages(helpRequest) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  '/requests',
  [query('latitude').isFloat(), query('longitude').isFloat()],
  async (req, res) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;

      const bbox = getBoundingBox(latitude, longitude, 5000);

      let where: any = {
        latitude: { gte: bbox.minLat, lte: bbox.maxLat },
        longitude: { gte: bbox.minLon, lte: bbox.maxLon },
      };
      if (type) where.type = type;
      if (status) where.status = status;

      let requests = await prisma.helpRequest.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true, avatar: true, creditScore: true } },
          responses: true,
        },
        orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
      });

      requests = requests
        .map(r => ({
          ...parseHelpImages(r),
          responses: r.responses?.map(parseHelpImages) || [],
          distance: calculateDistance(latitude, longitude, r.latitude, r.longitude),
        }))
        .filter(r => r.distance <= r.radiusMeters)
        .sort((a, b) => {
          if (a.type === 'EMERGENCY' && b.type !== 'EMERGENCY') return -1;
          if (b.type === 'EMERGENCY' && a.type !== 'EMERGENCY') return 1;
          return (a.urgency - b.urgency) || (a.distance - b.distance);
        });

      res.json({ helpRequests: requests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/requests/:id', async (req, res) => {
  try {
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, nickname: true, avatar: true, phone: true } },
        responses: {
          include: { user: { select: { id: true, nickname: true, avatar: true, creditScore: true } } },
        },
        messages: {
          include: { sender: { select: { id: true, nickname: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!helpRequest) return res.status(404).json({ error: '求助不存在' });
    const result = {
      ...parseHelpImages(helpRequest),
      responses: helpRequest.responses?.map(parseHelpImages) || [],
    };
    res.json({ helpRequest: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/requests/:id/respond',
  auth,
  [body('content').isLength({ min: 1 })],
  async (req: AuthRequest, res) => {
    try {
      const { images, ...bodyData } = req.body;
      const response = await prisma.helpResponse.create({
        data: {
          requestId: req.params.id,
          userId: req.userId!,
          content: bodyData.content,
          images: toJson(images),
        },
        include: { user: { select: { id: true, nickname: true, avatar: true } } },
      });

      const request = await prisma.helpRequest.findUnique({ where: { id: req.params.id } });
      if (request && request.status === 'OPEN') {
        await prisma.helpRequest.update({
          where: { id: req.params.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      res.json({ response: parseHelpImages(response) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/requests/:id/accept/:responseId', auth, async (req: AuthRequest, res) => {
  try {
    const helpRequest = await prisma.helpRequest.findUnique({ where: { id: req.params.id } });
    if (!helpRequest || helpRequest.userId !== req.userId) {
      return res.status(403).json({ error: '无权操作' });
    }

    const resp = await prisma.helpResponse.findUnique({ where: { id: req.params.responseId } });

    await prisma.$transaction([
      prisma.helpResponse.update({
        where: { id: req.params.responseId },
        data: { isAccepted: true },
      }),
      prisma.helpRequest.update({
        where: { id: req.params.id },
        data: {
          status: 'RESOLVED',
          acceptedBy: resp?.userId,
          closedAt: new Date(),
        },
      }),
    ]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/requests/:id/message',
  auth,
  [body('content').isLength({ min: 1 })],
  async (req: AuthRequest, res) => {
    try {
      const message = await prisma.message.create({
        data: {
          helpRequestId: req.params.id,
          senderId: req.userId!,
          content: req.body.content,
        },
        include: { sender: { select: { id: true, nickname: true, avatar: true } } },
      });
      res.json({ message });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/my/requests', auth, async (req: AuthRequest, res) => {
  try {
    const requests = await prisma.helpRequest.findMany({
      where: { userId: req.userId },
      include: { responses: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ helpRequests: requests.map(parseHelpImages) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my/responses', auth, async (req: AuthRequest, res) => {
  try {
    const responses = await prisma.helpResponse.findMany({
      where: { userId: req.userId },
      include: { request: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ responses: responses.map(r => ({ ...parseHelpImages(r), request: parseHelpImages(r.request) })) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
