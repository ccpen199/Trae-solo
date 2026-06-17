import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { CITIES, VEHICLE_TYPES, ORDER_CATEGORIES, LEVELS } from '../data/seed';

const router = Router();

router.get('/cities', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM cities WHERE status = ? ORDER BY name').all('active') as Record<string, unknown>[];
    if (rows.length > 0) {
      const data = rows.map(r => ({
        id: r.id,
        name: r.name,
        province: r.province,
        tier: r.tier,
        centerLat: r.center_lat,
        centerLng: r.center_lng,
        pricingConfig: r.pricing_config ? JSON.parse(r.pricing_config as string) : {},
        status: r.status
      }));
      res.json({ code: 0, message: 'ok', data });
    } else {
      res.json({ code: 0, message: 'ok', data: CITIES });
    }
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/vehicle-types', (req: Request, res: Response) => {
  try {
    res.json({ code: 0, message: 'ok', data: VEHICLE_TYPES });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/order-categories', (req: Request, res: Response) => {
  try {
    res.json({ code: 0, message: 'ok', data: ORDER_CATEGORIES });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/levels', (req: Request, res: Response) => {
  try {
    res.json({ code: 0, message: 'ok', data: LEVELS });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;
