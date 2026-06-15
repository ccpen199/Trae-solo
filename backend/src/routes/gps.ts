import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { order_id, order_type, latitude, longitude, speed, heading, accuracy } = req.body;

  if (!order_id || !order_type || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  const db = getDB();
  const trackId = uuidv4();

  db.prepare(`
    INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, speed, heading, accuracy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(trackId, order_id, order_type, req.user!.id, latitude, longitude, speed || null, heading || null, accuracy || null);

  res.json({ success: true, track_id: trackId });
});

router.get('/:order_id/:order_type', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { order_id, order_type } = req.params;
  const { limit = 100 } = req.query;

  const tracks = db.prepare(`
    SELECT * FROM gps_tracks 
    WHERE order_id = ? AND order_type = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(order_id, order_type, Number(limit)) as any[];

  res.json({ tracks: tracks.reverse() });
});

router.post('/batch', authMiddleware, (req: AuthRequest, res: Response) => {
  const { order_id, order_type, points } = req.body;

  if (!order_id || !order_type || !points || !Array.isArray(points)) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  const db = getDB();
  const insertStmt = db.prepare(`
    INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, speed, heading, accuracy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const point of points) {
      const trackId = uuidv4();
      insertStmt.run(
        trackId, order_id, order_type, req.user!.id,
        point.latitude, point.longitude, point.speed || null,
        point.heading || null, point.accuracy || null
      );
    }
  });

  transaction();

  res.json({ success: true, count: points.length });
});

export default router;
