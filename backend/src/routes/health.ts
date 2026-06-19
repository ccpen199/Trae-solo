import { Router } from 'express';
import { getHealthMetrics, getRealtimeMetrics, getHealthTrend } from '../services/healthService';

const router = Router();

router.get('/summary', (req, res) => {
  const metrics = getHealthMetrics();
  res.json({ code: 0, data: metrics });
});

router.get('/realtime', (req, res) => {
  const metrics = getRealtimeMetrics();
  res.json({ code: 0, data: metrics });
});

router.get('/trend', (req, res) => {
  const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
  const trend = getHealthTrend(hours);
  res.json({ code: 0, data: trend });
});

export default router;
