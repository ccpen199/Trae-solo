import { Router, type Request, type Response } from 'express';
import {
  TOWNSHIP_DATA,
  getTownship,
  getJobsByTownship,
  getEnterprisesByTownship,
} from '../mock/mockData.js';
import { ApiResponse, Township, JobPosition, Enterprise } from '../../shared/types/index.js';

const router = Router();

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const withStats = req.query.withStats === 'true';

  if (withStats) {
    const enriched = TOWNSHIP_DATA.map(t => {
      const jobs = getJobsByTownship(t.code);
      const enterprises = getEnterprisesByTownship(t.code);
      return {
        ...t,
        jobCount: jobs.length,
        enterpriseCount: enterprises.length,
        avgSalary: jobs.length > 0
          ? Math.round(jobs.reduce((s, j) => s + (j.salaryRange[0] + j.salaryRange[1]) / 2, 0) / jobs.length)
          : 0,
        activeJobs: jobs.filter(j => j.status === '招聘中').length,
      };
    });
    res.json(ok(enriched));
  } else {
    res.json(ok<Township[]>(TOWNSHIP_DATA));
  }
});

router.get('/:code/jobs', async (req: Request, res: Response): Promise<void> => {
  const code = req.params.code;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;

  const township = getTownship(code as any);
  if (!township) {
    res.status(404).json(fail('镇街不存在'));
    return;
  }

  let jobs = getJobsByTownship(code as any);

  if (status) {
    jobs = jobs.filter(j => j.status === status);
  }

  jobs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const total = jobs.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = jobs.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
});

router.get('/:code/enterprises', async (req: Request, res: Response): Promise<void> => {
  const code = req.params.code;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const verifiedOnly = req.query.verifiedOnly === 'true';

  const township = getTownship(code as any);
  if (!township) {
    res.status(404).json(fail('镇街不存在'));
    return;
  }

  let enterprises = getEnterprisesByTownship(code as any);

  if (verifiedOnly) {
    enterprises = enterprises.filter(e => e.verified);
  }

  const total = enterprises.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = enterprises.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
});

export default router;
