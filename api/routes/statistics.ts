import { Router } from 'express';
import { statisticsService } from '../services/StatisticsService';

const router = Router();

router.get('/accuracy', (req, res) => {
  const { cityId } = req.query;
  
  if (!cityId) {
    res.status(400).json({ error: '缺少 cityId 参数' });
    return;
  }

  const data = statisticsService.getStreetAccuracy(String(cityId));
  res.json({ data });
});

router.get('/misjudgments', (req, res) => {
  const { cityId, limit } = req.query;
  
  if (!cityId) {
    res.status(400).json({ error: '缺少 cityId 参数' });
    return;
  }

  const data = statisticsService.getMisjudgments(
    String(cityId),
    parseInt(String(limit || '20'))
  );

  res.json({ data });
});

router.get('/trend', (req, res) => {
  const { cityId, days } = req.query;
  
  if (!cityId) {
    res.status(400).json({ error: '缺少 cityId 参数' });
    return;
  }

  const data = statisticsService.getTrendData(
    String(cityId),
    parseInt(String(days || '30'))
  );

  res.json({ data });
});

router.get('/overview', (req, res) => {
  const { cityId } = req.query;
  
  if (!cityId) {
    res.status(400).json({ error: '缺少 cityId 参数' });
    return;
  }

  const stats = statisticsService.getOverallStats(String(cityId));
  res.json({ stats });
});

export default router;
