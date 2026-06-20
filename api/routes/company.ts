import { Router, type Request, type Response } from 'express';
import { CompanyService } from '../services/company.service.js';

const router = Router();

router.get('/list', async (req: Request, res: Response): Promise<void> => {
  const result = await CompanyService.getCompanyList({
    industry: req.query.industry as string,
    status: req.query.status as any,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  });
  res.json(result);
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const result = await CompanyService.getCompanyById(req.params.id);
  res.json(result);
});

router.get('/:id/qualification', async (req: Request, res: Response): Promise<void> => {
  const result = await CompanyService.getCompanyQualification(req.params.id);
  res.json(result);
});

router.put('/qualification/:id/status', async (req: Request, res: Response): Promise<void> => {
  const result = await CompanyService.updateCompanyQualificationStatus(
    req.params.id,
    req.body.status
  );
  res.json(result);
});

export default router;
