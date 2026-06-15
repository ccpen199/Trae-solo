import { Router, type Request, type Response } from 'express';
import {
  MOCK_JOBS,
  MOCK_RESUMES,
  getJobById,
  getResumeById,
} from '../mock/mockData.js';
import { calculateMatch } from '../services/matchingService.js';
import { ApiResponse, JobPosition, MatchResult } from '../../shared/types/index.js';

const router = Router();

const DEFAULT_RESUME_ID = 'res_00001';

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const keyword = (req.query.keyword as string)?.trim() || '';
  const township = req.query.township as string;
  const industry = req.query.industry as string;
  const salaryMin = parseInt(req.query.salaryMin as string) || 0;
  const salaryMax = parseInt(req.query.salaryMax as string) || 999999;
  const experience = req.query.experience as string;
  const education = req.query.education as string;
  const sortBy = (req.query.sortBy as string) || 'publishedAt';
  const sortOrder = (req.query.sortOrder as string) || 'desc';

  let filtered = [...MOCK_JOBS];

  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(j =>
      j.title.toLowerCase().includes(kw) ||
      j.enterpriseName?.toLowerCase().includes(kw) ||
      j.jobDescription.toLowerCase().includes(kw) ||
      j.requiredSkills.some(s => s.name.toLowerCase().includes(kw))
    );
  }

  if (township) {
    filtered = filtered.filter(j => j.township === township);
  }

  if (industry) {
    filtered = filtered.filter(j => {
      const skills = j.requiredSkills.map(s => s.name).join(',');
      return skills.includes(industry);
    });
  }

  if (salaryMin > 0) {
    filtered = filtered.filter(j => j.salaryRange[1] >= salaryMin);
  }

  if (salaryMax < 999999) {
    filtered = filtered.filter(j => j.salaryRange[0] <= salaryMax);
  }

  if (experience) {
    filtered = filtered.filter(j => j.experience === experience);
  }

  if (education) {
    filtered = filtered.filter(j => j.education === education || j.education === '不限');
  }

  filtered.sort((a, b) => {
    let result = 0;
    switch (sortBy) {
      case 'salary':
        result = a.salaryRange[0] - b.salaryRange[0];
        break;
      case 'views':
        result = a.views - b.views;
        break;
      case 'applications':
        result = a.applicationsCount - b.applicationsCount;
        break;
      case 'publishedAt':
      default:
        result = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);
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

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const jobId = req.params.id;
  const job = getJobById(jobId);

  if (!job) {
    res.status(404).json(fail('职位不存在'));
    return;
  }

  res.json(ok<JobPosition>({
    ...job,
    views: job.views + 1,
  }));
});

router.get('/:id/match', async (req: Request, res: Response): Promise<void> => {
  const jobId = req.params.id;
  const resumeId = (req.query.resumeId as string) || DEFAULT_RESUME_ID;

  const job = getJobById(jobId);
  if (!job) {
    res.status(404).json(fail('职位不存在'));
    return;
  }

  const resume = getResumeById(resumeId) || MOCK_RESUMES[0];
  const matchResult: MatchResult = calculateMatch(resume, job);

  res.json(ok<MatchResult>(matchResult));
});

export default router;
