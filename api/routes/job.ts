import { Router, type Request, type Response } from 'express';
import { JobService } from '../services/job.service.js';

const router = Router();

router.get('/list', async (req: Request, res: Response): Promise<void> => {
  const result = await JobService.getJobList({
    industry: req.query.industry as string,
    status: req.query.status as any,
    companyId: req.query.companyId as string,
    keyword: req.query.keyword as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  });
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const result = await JobService.getJobById(req.params.id);
  res.json(result);
});

router.post('/generate-jd', async (req: Request, res: Response): Promise<void> => {
  const result = await JobService.generateJD(req.body.painPoint);
  res.json(result);
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const result = await JobService.createJob(req.body);
  res.json(result);
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const result = await JobService.updateJob(req.params.id, req.body);
  res.json(result);
});

router.put('/:id/publish', async (req: Request, res: Response): Promise<void> => {
  const result = await JobService.publishJob(req.params.id);
  res.json(result);
});

router.put('/:id/close', async (req: Request, res: Response): Promise<void> => {
  const result = await JobService.closeJob(req.params.id);
  res.json(result);
});

export default router;
