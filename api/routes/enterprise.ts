import { Router, type Request, type Response } from 'express';
import {
  MOCK_ENTERPRISES,
  generateEnterpriseDashboard,
  getJobsByEnterprise,
  getResumesByEnterprise,
  getEnterpriseById,
  MOCK_RESUMES,
} from '../mock/mockData.js';
import {
  ApiResponse,
  JobPosition,
  Resume,
  Enterprise,
} from '../../shared/types/index.js';

type EnterpriseDashboard = any;
const TOWNSHIP_DATA: any[] = [];

const router = Router();

const DEFAULT_ENTERPRISE_ID = 'ent_0001';

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string): ApiResponse {
  return { success: false, error };
}

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  const enterpriseId = (req.query.enterpriseId as string) || DEFAULT_ENTERPRISE_ID;
  const enterprise = getEnterpriseById(enterpriseId);

  if (!enterprise) {
    res.status(404).json(fail('企业不存在'));
    return;
  }

  const dashboard = generateEnterpriseDashboard(enterpriseId);
  res.json(ok<EnterpriseDashboard>(dashboard));
});

router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  const enterpriseId = (req.query.enterpriseId as string) || DEFAULT_ENTERPRISE_ID;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;

  const enterprise = getEnterpriseById(enterpriseId);
  if (!enterprise) {
    res.status(404).json(fail('企业不存在'));
    return;
  }

  let jobs = getJobsByEnterprise(enterpriseId);
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
    pagination: { page, pageSize, total, totalPages },
  });
});

router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  const enterpriseId = (req.query.enterpriseId as string) || DEFAULT_ENTERPRISE_ID;
  const jobData = req.body as Partial<JobPosition>;
  const enterprise = getEnterpriseById(enterpriseId);

  if (!enterprise) {
    res.status(404).json(fail('企业不存在'));
    return;
  }

  const newJob: JobPosition = {
    id: `job_new_${Date.now()}`,
    enterpriseId,
    enterpriseName: enterprise.name,
    title: jobData.title || '新发布职位',
    township: enterprise.township,
    townshipName: TOWNSHIP_DATA.find((t: any) => t.code === enterprise.township)?.name || '',
    salaryRange: jobData.salaryRange || [4000, 6000],
    salaryType: jobData.salaryType || '月薪',
    experience: jobData.experience || '不限',
    education: jobData.education || '不限',
    requiredSkills: jobData.requiredSkills || [],
    jobDescription: jobData.jobDescription || '请填写职位描述',
    welfareTags: jobData.welfareTags || (enterprise as any).welfareTags,
    channel: jobData.channel || '招聘网站',
    status: (jobData.status || '招聘中') as any,
    publishedAt: new Date().toISOString(),
    type: (jobData as any).type || '蓝领',
    salaryMin: (jobData as any).salaryMin || 4000,
    salaryMax: (jobData as any).salaryMax || 8000,
    responsibilities: [],
    requirements: [],
    benefits: [],
    hiringCount: 1,
    urgent: false,
    viewCount: 0,
    applicationCount: 0,
  } as any;

  res.json(ok<JobPosition>(newJob, '职位发布成功'));
});

router.get('/resumes', async (req: Request, res: Response): Promise<void> => {
  const enterpriseId = (req.query.enterpriseId as string) || DEFAULT_ENTERPRISE_ID;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string)?.trim();

  const enterprise = getEnterpriseById(enterpriseId);
  if (!enterprise) {
    res.status(404).json(fail('企业不存在'));
    return;
  }

  let resumes = getResumesByEnterprise(enterpriseId);

  if (search) {
    const kw = search.toLowerCase();
    resumes = resumes.filter(r =>
      r.basicInfo.name.toLowerCase().includes(kw) ||
      r.skillList.some(s => s.name.toLowerCase().includes(kw)) ||
      r.workExperienceList.some(w => w.position.toLowerCase().includes(kw))
    );
  }

  const total = resumes.length;
  const startIdx = (page - 1) * pageSize;
  const paginated = resumes.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
});

router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  const enterpriseId = (req.query.enterpriseId as string) || DEFAULT_ENTERPRISE_ID;
  const enterprise = getEnterpriseById(enterpriseId) || MOCK_ENTERPRISES[0];

  if (!enterprise) {
    res.status(404).json(fail('企业不存在'));
    return;
  }

  res.json(ok<Enterprise>(enterprise));
});

export default router;
