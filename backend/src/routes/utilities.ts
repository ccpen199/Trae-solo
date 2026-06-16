import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { auth, AuthRequest, requireRole } from '../middleware/auth';
import { getBoundingBox, calculateDistance } from '../utils/lbs';
import { parseJson, toJson } from '../utils/json';

const router = express.Router();

router.get('/services', async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const services = await prisma.utilityService.findMany({
      where: type ? { type } : undefined,
      include: { updates: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    const parsed = services.map(s => ({
      ...s,
      data: parseJson(s.data, {}),
    }));
    res.json({ services: parsed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/updates', async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const severity = req.query.severity ? parseInt(req.query.severity as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    let where: any = {};
    if (type) where.service = { type };
    if (severity) where.severity = { gte: severity };

    const updates = await prisma.utilityUpdate.findMany({
      where,
      include: { service: true },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({ updates, page, hasMore: updates.length === limit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  '/bus/stations',
  [query('latitude').isFloat(), query('longitude').isFloat()],
  async (req, res) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseInt(req.query.radius as string) || 1000;
      const bbox = getBoundingBox(latitude, longitude, radius);

      const busService = await prisma.utilityService.findFirst({
        where: { type: 'BUS' },
      });

      if (!busService || !busService.data) {
        return res.json({ stations: [] });
      }

      const serviceData = parseJson<any>(busService.data, { stations: [] });
      const allStations = serviceData?.stations || [];

      const stations = allStations
        .filter((s: any) =>
          s.lat >= bbox.minLat && s.lat <= bbox.maxLat &&
          s.lon >= bbox.minLon && s.lon <= bbox.maxLon
        )
        .map((s: any) => ({
          ...s,
          distance: calculateDistance(latitude, longitude, s.lat, s.lon),
          predictions: s.lines?.map((line: any) => ({
            lineName: line.name,
            arrivalMinutes: Math.floor(Math.random() * 15) + 1,
            nextArrivalMinutes: Math.floor(Math.random() * 30) + 15,
          })) || [],
        }))
        .filter((s: any) => s.distance <= radius)
        .sort((a: any, b: any) => a.distance - b.distance);

      res.json({ stations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  '/test-sites',
  [query('latitude').optional().isFloat(), query('longitude').optional().isFloat()],
  async (req, res) => {
    try {
      const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
      const radius = parseInt(req.query.radius as string) || 3000;

      const covidService = await prisma.utilityService.findFirst({
        where: { type: 'COVID_TEST' },
      });

      if (!covidService || !covidService.data) {
        return res.json({ sites: [] });
      }

      const data = parseJson<any>(covidService.data, { sites: [] });
      let sites = data?.sites || [];

      if (latitude && longitude) {
        const bbox = getBoundingBox(latitude, longitude, radius);
        sites = sites
          .filter((s: any) =>
            s.lat >= bbox.minLat && s.lat <= bbox.maxLat &&
            s.lon >= bbox.minLon && s.lon <= bbox.maxLon
          )
          .map((s: any) => ({
            ...s,
            distance: calculateDistance(latitude, longitude, s.lat, s.lon),
          }))
          .filter((s: any) => s.distance <= radius)
          .sort((a: any, b: any) => a.distance - b.distance);
      }

      res.json({ sites });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/services',
  auth,
  requireRole('ADMIN', 'GOVERNMENT'),
  async (req: AuthRequest, res) => {
    try {
      const service = await prisma.utilityService.create({
        data: {
          type: req.body.type,
          name: req.body.name,
          provider: req.body.provider,
          data: toJson(req.body.data || {}) || '{}',
        },
      });
      res.json({ service: { ...service, data: parseJson(service.data, {}) } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/updates',
  auth,
  requireRole('ADMIN', 'GOVERNMENT'),
  [body('serviceId').exists(), body('title').exists(), body('content').exists()],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const update = await prisma.utilityUpdate.create({
        data: {
          serviceId: req.body.serviceId,
          title: req.body.title,
          content: req.body.content,
          locationScope: req.body.locationScope || '全区',
          startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
          endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
          severity: req.body.severity || 1,
        },
      });
      res.json({ update });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/subscribe', auth, async (req: AuthRequest, res) => {
  try {
    const { type, targetId } = req.body;
    const subscription = await prisma.subscription.upsert({
      where: {
        userId_type_targetId: {
          userId: req.userId!,
          type,
          targetId: targetId || '',
        },
      },
      update: { notify: true },
      create: {
        userId: req.userId!,
        type,
        targetId: targetId || null,
      },
    });
    res.json({ subscription });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subscriptions', auth, async (req: AuthRequest, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.userId },
    });
    res.json({ subscriptions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subscriptions/:id', auth, async (req: AuthRequest, res) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!sub || sub.userId !== req.userId) {
      return res.status(403).json({ error: '无权操作' });
    }
    await prisma.subscription.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
