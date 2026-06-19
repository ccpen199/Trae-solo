import { Router, type Request, type Response } from 'express';
import { CompetencyGraphService } from '../services/CompetencyGraphService.js';

const router = Router();

router.get('/industries', (req: Request, res: Response) => {
  try {
    const data = CompetencyGraphService.getIndustries();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/jobs', (req: Request, res: Response) => {
  try {
    const { industryId, keyword, page, pageSize } = req.query;
    const result = CompetencyGraphService.getJobs({
      industryId: industryId as string,
      keyword: keyword as string,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/jobs/:id', (req: Request, res: Response) => {
  try {
    const data = CompetencyGraphService.getCompetencyModel(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Competency model not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/promotion-path/:jobId', (req: Request, res: Response) => {
  try {
    const data = CompetencyGraphService.getPromotionPath(req.params.jobId);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Promotion path not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
