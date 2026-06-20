import { Router, type Request, type Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import type { IndustryType } from '@shared/types';

const router = Router();

router.get('/recruitment-metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId as string | undefined;

    const result = await AnalyticsService.getRecruitmentMetrics(companyId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取招聘指标失败' });
  }
});

router.get('/channel-funnel', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await AnalyticsService.getChannelFunnelData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取渠道漏斗数据失败' });
  }
});

router.get('/time-to-hire', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await AnalyticsService.getTimeToHireByRole();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取各岗位招聘周期数据失败' });
  }
});

router.get('/knowledge-graphs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await AnalyticsService.getKnowledgeGraphs();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取知识图谱失败' });
  }
});

router.get('/promotion-paths', async (req: Request, res: Response): Promise<void> => {
  try {
    const industry = req.query.industry as IndustryType | undefined;
    const jobTitle = req.query.jobTitle as string | undefined;

    const result = await AnalyticsService.getPromotionPaths(industry, jobTitle);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: '获取晋升路径失败' });
  }
});

export default router;
