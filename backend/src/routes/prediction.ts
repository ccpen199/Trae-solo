import { Router } from 'express';
import {
  predictOrders,
  generatePredictions,
  getPredictionTrend,
  getRegionStats,
} from '../services/predictionService';

const router = Router();

router.get('/trend', (req, res) => {
  const regionId = req.query.region_id ? parseInt(req.query.region_id as string) : 1;
  const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
  const trend = getPredictionTrend(regionId, hours);
  res.json({ code: 0, data: trend });
});

router.get('/region/:regionId', (req, res) => {
  const regionId = parseInt(req.params.regionId);
  const stats = getRegionStats(regionId);
  res.json({ code: 0, data: stats });
});

router.post('/predict', (req, res) => {
  const { region_id, date, hour } = req.body;
  const result = predictOrders(region_id || 1, date, hour);
  res.json({ code: 0, data: result });
});

router.post('/generate', (req, res) => {
  const { region_id, days } = req.body;
  const predictions = generatePredictions(region_id || 1, days || 1);
  res.json({ code: 0, data: { count: predictions.length } });
});

export default router;
