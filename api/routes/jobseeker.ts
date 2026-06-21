import { Router, type Request, type Response } from 'express';
import type {
  Resume,
  Job,
  Application,
  Interview,
  Authorization,
  MatchResult,
} from '../../shared/types.js';
import {
  mockResumes,
  mockJobs,
  mockCompanies,
  mockApplications,
  mockInterviews,
  mockAuthorizations,
} from '../mock/data.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateBlockchainHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function calculateMatchScore(job: Job, resume: Resume): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (resume.preferences.industries.includes(job.industry)) {
    score += 30;
    reasons.push('行业偏好匹配');
  }
  const jobSalaryMid = (job.salaryMin + job.salaryMax) / 2;
  const prefSalaryMin = resume.preferences.salaryMin ?? 0;
  const prefSalaryMax = resume.preferences.salaryMax ?? Infinity;
  if (jobSalaryMid >= prefSalaryMin && jobSalaryMid <= prefSalaryMax) {
    score += 25;
    reasons.push('薪资范围匹配');
  }
  const skillMatches = resume.skillTags.filter(s =>
    job.tags.some(tag => s.name.includes(tag) || tag.includes(s.name))
  ).length;
  if (skillMatches > 0) {
    score += Math.min(skillMatches * 10, 25);
    reasons.push(`技能标签匹配(${skillMatches}项)`);
  }
  const hasMatchingExperience = resume.workExperience.some(exp =>
    job.requirements.some(req => exp.description.includes(req) || exp.position.includes(req.slice(0, 2)))
  );
  if (hasMatchingExperience) {
    score += 20;
    reasons.push('工作经验匹配');
  }
  return { score: Math.min(score, 100), reasons };
}

router.get('/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const resume = mockResumes[0];
    if (!resume) {
      res.status(404).json({ success: false, error: '简历不存在' });
      return;
    }
    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取简历失败' });
  }
});

router.put('/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body as Partial<Resume>;
    const index = mockResumes.findIndex(r => r.id === 'resume-001');
    if (index === -1) {
      res.status(404).json({ success: false, error: '简历不存在' });
      return;
    }
    mockResumes[index] = {
      ...mockResumes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    res.status(200).json({ success: true, data: mockResumes[index], message: '简历更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新简历失败' });
  }
});

router.patch('/resume/desensitize', async (req: Request, res: Response): Promise<void> => {
  try {
    const index = mockResumes.findIndex(r => r.id === 'resume-001');
    if (index === -1) {
      res.status(404).json({ success: false, error: '简历不存在' });
      return;
    }
    mockResumes[index].isDesensitized = !mockResumes[index].isDesensitized;
    mockResumes[index].updatedAt = new Date().toISOString();
    if (mockResumes[index].isDesensitized) {
      const name = mockResumes[index].basicInfo.name;
      const phone = mockResumes[index].basicInfo.phone;
      mockResumes[index].basicInfo.name = name.charAt(0) + '**';
      mockResumes[index].basicInfo.phone = phone.slice(0, 3) + '****' + phone.slice(-4);
      delete mockResumes[index].basicInfo.idCard;
      delete mockResumes[index].basicInfo.avatar;
    }
    res.status(200).json({
      success: true,
      data: mockResumes[index],
      message: mockResumes[index].isDesensitized ? '简历已脱敏' : '简历已恢复',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新脱敏状态失败' });
  }
});

router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, industry, salaryMin, salaryMax, withMatchScore } = req.query;
    let jobs = [...mockJobs].filter(j => j.status === 'published' && j.reviewStatus === 'approved');
    if (search && typeof search === 'string') {
      const kw = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(kw) ||
        j.companyName.toLowerCase().includes(kw) ||
        j.tags.some(t => t.toLowerCase().includes(kw)) ||
        j.description.toLowerCase().includes(kw)
      );
    }
    if (industry && typeof industry === 'string') {
      jobs = jobs.filter(j => j.industry === industry);
    }
    if (salaryMin && typeof salaryMin === 'string') {
      const min = parseInt(salaryMin);
      jobs = jobs.filter(j => j.salaryMax >= min);
    }
    if (salaryMax && typeof salaryMax === 'string') {
      const max = parseInt(salaryMax);
      jobs = jobs.filter(j => j.salaryMin <= max);
    }
    if (withMatchScore === 'true') {
      const resume = mockResumes[0];
      const results: MatchResult[] = jobs.map(job => {
        const { score, reasons } = calculateMatchScore(job, resume);
        return {
          jobId: job.id,
          job,
          matchScore: score,
          matchReasons: reasons,
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
      res.status(200).json({ success: true, data: results });
    } else {
      res.status(200).json({ success: true, data: jobs });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '获取职位列表失败' });
  }
});

router.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = mockJobs.find(j => j.id === id);
    if (!job) {
      res.status(404).json({ success: false, error: '职位不存在' });
      return;
    }
    const company = mockCompanies.find(c => c.id === job.companyId);
    res.status(200).json({ success: true, data: { ...job, company } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取职位详情失败' });
  }
});

router.post('/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, userId, resumeId } = req.body as { jobId: string; userId: string; resumeId: string };
    const job = mockJobs.find(j => j.id === jobId);
    if (!job) {
      res.status(404).json({ success: false, error: '职位不存在' });
      return;
    }
    const resume = mockResumes.find(r => r.id === resumeId);
    const newApp: Application = {
      id: generateId('app'),
      jobId,
      userId,
      resumeId,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      job,
      userName: resume?.basicInfo.name,
      userPhone: resume?.basicInfo.phone,
    };
    mockApplications.push(newApp);
    res.status(201).json({ success: true, data: newApp, message: '投递成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '投递失败' });
  }
});

router.get('/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'user-002';
    const myApplications = mockApplications
      .filter(a => a.userId === userId)
      .map(app => {
        const job = mockJobs.find(j => j.id === app.jobId);
        return { ...app, job };
      });
    res.status(200).json({ success: true, data: myApplications });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取申请列表失败' });
  }
});

router.get('/interview', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'user-002';
    const myInterviews = mockInterviews.filter(i => i.userId === userId);
    res.status(200).json({ success: true, data: myInterviews });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取面试列表失败' });
  }
});

router.post('/interview/:id/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { accept } = req.body as { accept: boolean };
    const index = mockInterviews.findIndex(i => i.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: '面试记录不存在' });
      return;
    }
    mockInterviews[index].status = accept ? 'accepted' : 'rejected';
    mockInterviews[index].respondedAt = new Date().toISOString();
    if (accept) {
      const app = mockApplications.find(a => a.id === mockInterviews[index].applicationId);
      if (app) app.status = 'interviewing';
    }
    res.status(200).json({
      success: true,
      data: mockInterviews[index],
      message: accept ? '已接受面试邀请' : '已拒绝面试邀请',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '响应面试失败' });
  }
});

router.get('/authorization', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = 'user-002';
    const myAuths = mockAuthorizations.filter(a => a.userId === userId);
    res.status(200).json({ success: true, data: myAuths });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取授权列表失败' });
  }
});

router.post('/authorization', async (req: Request, res: Response): Promise<void> => {
  try {
    const { employerId, employerName, scope } = req.body as {
      employerId: string;
      employerName: string;
      scope: string[];
    };
    const newAuth: Authorization = {
      id: generateId('auth'),
      userId: 'user-002',
      employerId,
      employerName,
      scope,
      grantedAt: new Date().toISOString(),
      blockchainHash: generateBlockchainHash(),
    };
    mockAuthorizations.push(newAuth);
    res.status(201).json({ success: true, data: newAuth, message: '授权已创建' });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建授权失败' });
  }
});

router.delete('/authorization/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const index = mockAuthorizations.findIndex(a => a.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: '授权记录不存在' });
      return;
    }
    mockAuthorizations[index].revokedAt = new Date().toISOString();
    res.status(200).json({ success: true, data: mockAuthorizations[index], message: '授权已撤销' });
  } catch (error) {
    res.status(500).json({ success: false, error: '撤销授权失败' });
  }
});

export default router;
