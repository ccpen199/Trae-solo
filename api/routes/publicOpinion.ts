import { Router, type Request, type Response } from 'express';
import {
  mockOpinionSummary,
  mockHeatTrend,
  mockSpreadGraph,
} from '../data/opinionData.js';

const router = Router();

router.get('/summary', (req: Request, res: Response): void => {
  res.json({ success: true, data: mockOpinionSummary });
});

router.get('/heat-trend', (req: Request, res: Response): void => {
  const { days = '7' } = req.query as { days?: string };
  const daysNum = parseInt(days, 10);
  
  const trend = mockHeatTrend.slice(-daysNum);
  
  res.json({ success: true, data: trend });
});

router.get('/hot-topics', (req: Request, res: Response): void => {
  const { limit = '10' } = req.query as { limit?: string };
  const limitNum = parseInt(limit, 10);
  
  const topics = mockOpinionSummary.hotTopics.slice(0, limitNum);
  
  res.json({ success: true, data: topics });
});

router.get('/spread-graph', (req: Request, res: Response): void => {
  const { topicId } = req.query as { topicId?: string };
  res.json({ success: true, data: mockSpreadGraph });
});

export default router;
