import { Router, type Response } from 'express';
import db from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware.js';
import type { Recording } from '../types.js';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const deviceId = req.query.deviceId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const aiTag = req.query.aiTag as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (deviceId && deviceId !== 'all') {
    where += ' AND r.device_id = ?';
    params.push(parseInt(deviceId));
  }
  if (startDate) {
    where += ' AND r.start_time >= ?';
    params.push(startDate);
  }
  if (endDate) {
    where += ' AND r.end_time <= ?';
    params.push(endDate);
  }
  if (aiTag && aiTag !== 'all') {
    where += ' AND r.ai_tags LIKE ?';
    params.push(`%"${aiTag}"%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM recordings r ${where}`).get(...params) as { count: number };
  const offset = (page - 1) * pageSize;
  const list = db.prepare(`
    SELECT r.*, d.name as device_name
    FROM recordings r
    LEFT JOIN devices d ON r.device_id = d.id
    ${where}
    ORDER BY r.start_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as Recording[];

  res.json({ success: true, list, total: total.count });
});

router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const recording = db.prepare(`
    SELECT r.*, d.name as device_name
    FROM recordings r
    LEFT JOIN devices d ON r.device_id = d.id
    WHERE r.id = ?
  `).get(id) as Recording;
  if (!recording) {
    res.status(404).json({ success: false, error: '录像不存在' });
    return;
  }
  res.json({ success: true, recording });
});

router.get('/:id/stream', requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, streamUrl: '/mock/stream.mp4' });
});

export default router;
