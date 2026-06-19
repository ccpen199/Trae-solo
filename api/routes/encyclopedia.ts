import { Router, type Request, type Response } from 'express';
import { EncyclopediaService } from '../services/EncyclopediaService.js';

const router = Router();

router.get('/jobs', (req: Request, res: Response) => {
  try {
    const { keyword, category, page, pageSize } = req.query;
    const result = EncyclopediaService.getJobs({
      keyword: keyword as string,
      category: category as string,
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
    const data = EncyclopediaService.getJobDetail(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Encyclopedia entry not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/interviews', (req: Request, res: Response) => {
  try {
    const { jobId, page, pageSize } = req.query;
    const result = EncyclopediaService.getInterviews({
      jobId: jobId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
