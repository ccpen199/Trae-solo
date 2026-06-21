import { Router, type Request, type Response } from 'express';
import type {
  Company,
  VerificationRecord,
  OCRResult,
  RiskScanResult,
  Job,
  Resume,
  Application,
  Interview,
  AnalyticsData,
} from '../../shared/types.js';
import {
  mockCompanies,
  mockVerificationRecords,
  mockJobs,
  mockResumes,
  mockApplications,
  mockInterviews,
  mockAnalyticsData,
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

router.get('/company', async (req: Request, res: Response): Promise<void> => {
  try {
    const company = mockCompanies[0];
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公司信息失败' });
  }
});

router.put('/company', async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body as Partial<Company>;
    const index = mockCompanies.findIndex(c => c.id === 'comp-001');
    if (index === -1) {
      res.status(404).json({ success: false, error: '公司不存在' });
      return;
    }
    mockCompanies[index] = { ...mockCompanies[index], ...updates };
    res.status(200).json({ success: true, data: mockCompanies[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新公司信息失败' });
  }
});

router.post('/verification/ocr', async (req: Request, res: Response): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const ocrResult: OCRResult = {
      companyName: '安心家政服务有限公司',
      licenseNo: '91310115MA1K4N4T0Z',
      legalPerson: '陈美华',
      registeredCapital: '50万元',
      establishmentDate: '2021-09-10',
      businessScope: '家政服务、保洁服务、母婴护理',
      confidence: 0.91,
    };
    res.status(200).json({ success: true, data: ocrResult, message: 'OCR识别完成' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'OCR处理失败' });
  }
});

router.post('/verification/scan', async (req: Request, res: Response): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    const riskResult: RiskScanResult = {
      level: 'low',
      lawsuitCount: 1,
      executionCount: 0,
      dishonestCount: 0,
      administrativePenaltyCount: 0,
      details: [
        {
          type: 'lawsuit',
          title: '劳动争议纠纷',
          date: '2025-08-12',
          amount: '12000元',
          status: '已结案',
        },
      ],
    };
    res.status(200).json({ success: true, data: riskResult, message: '风险扫描完成' });
  } catch (error) {
    res.status(500).json({ success: false, error: '风险扫描失败' });
  }
});

router.get('/verification/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const record = mockVerificationRecords.find(v => v.companyId === 'comp-001');
    if (!record) {
      res.status(404).json({ success: false, error: '未找到认证记录' });
      return;
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取认证状态失败' });
  }
});

router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    let jobs = [...mockJobs];
    if (status && typeof status === 'string') {
      jobs = jobs.filter(j => j.status === status);
    }
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取职位列表失败' });
  }
});

router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const jobData = req.body as Omit<Job, 'id' | 'createdAt'>;
    const newJob: Job = {
      ...jobData,
      id: generateId('job'),
      createdAt: new Date().toISOString(),
    };
    mockJobs.push(newJob);
    res.status(201).json({ success: true, data: newJob, message: '职位创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建职位失败' });
  }
});

router.put('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<Job>;
    const index = mockJobs.findIndex(j => j.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: '职位不存在' });
      return;
    }
    mockJobs[index] = { ...mockJobs[index], ...updates };
    res.status(200).json({ success: true, data: mockJobs[index], message: '职位更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新职位失败' });
  }
});

router.patch('/jobs/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const index = mockJobs.findIndex(j => j.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: '职位不存在' });
      return;
    }
    const currentStatus = mockJobs[index].status;
    mockJobs[index].status = currentStatus === 'published' ? 'offline' : 'published';
    res.status(200).json({ success: true, data: mockJobs[index], message: '职位状态已更新' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新职位状态失败' });
  }
});

router.get('/talent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { industry, salaryMin, salaryMax, keyword } = req.query;
    let talentPool = [...mockResumes];
    if (keyword && typeof keyword === 'string') {
      const kw = keyword.toLowerCase();
      talentPool = talentPool.filter(r =>
        r.basicInfo.name.toLowerCase().includes(kw) ||
        r.skillTags.some(s => s.name.toLowerCase().includes(kw)) ||
        r.workExperience.some(w => w.position.toLowerCase().includes(kw) || w.companyName.toLowerCase().includes(kw))
      );
    }
    if (industry && typeof industry === 'string') {
      talentPool = talentPool.filter(r =>
        r.preferences.industries.includes(industry)
      );
    }
    if (salaryMin && typeof salaryMin === 'string') {
      const min = parseInt(salaryMin);
      talentPool = talentPool.filter(r =>
        (r.preferences.salaryMax ?? Infinity) >= min
      );
    }
    if (salaryMax && typeof salaryMax === 'string') {
      const max = parseInt(salaryMax);
      talentPool = talentPool.filter(r =>
        (r.preferences.salaryMin ?? 0) <= max
      );
    }
    res.status(200).json({ success: true, data: talentPool });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取人才库失败' });
  }
});

router.get('/talent/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const resume = mockResumes.find(r => r.id === id);
    if (!resume) {
      res.status(404).json({ success: false, error: '简历不存在' });
      return;
    }
    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取简历详情失败' });
  }
});

router.post('/talent/:id/contact', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const resume = mockResumes.find(r => r.id === id);
    if (!resume) {
      res.status(404).json({ success: false, error: '简历不存在' });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        phone: resume.basicInfo.phone,
        name: resume.basicInfo.name,
      },
      message: '联系方式已解锁',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '联系候选人失败' });
  }
});

router.get('/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    const applicationsWithJob = mockApplications.map(app => {
      const job = mockJobs.find(j => j.id === app.jobId);
      return { ...app, job };
    });
    res.status(200).json({ success: true, data: applicationsWithJob });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取申请列表失败' });
  }
});

router.post('/interview', async (req: Request, res: Response): Promise<void> => {
  try {
    const interviewData = req.body as Omit<Interview, 'id' | 'status'>;
    const application = mockApplications.find(a => a.id === interviewData.applicationId);
    if (application) {
      application.status = 'interviewing';
    }
    const newInterview: Interview = {
      ...interviewData,
      id: generateId('int'),
      status: 'pending',
    };
    mockInterviews.push(newInterview);
    res.status(201).json({ success: true, data: newInterview, message: '面试邀请已发送' });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建面试邀请失败' });
  }
});

router.get('/interview', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: mockInterviews });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取面试列表失败' });
  }
});

router.post('/interview/:id/feedback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes, result } = req.body as { notes?: string; result?: 'hire' | 'reject' | 'pending' };
    const index = mockInterviews.findIndex(i => i.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: '面试记录不存在' });
      return;
    }
    mockInterviews[index].notes = notes ?? mockInterviews[index].notes;
    mockInterviews[index].status = 'completed';
    if (result === 'hire') {
      const app = mockApplications.find(a => a.id === mockInterviews[index].applicationId);
      if (app) app.status = 'accepted';
    } else if (result === 'reject') {
      const app = mockApplications.find(a => a.id === mockInterviews[index].applicationId);
      if (app) app.status = 'rejected';
    }
    res.status(200).json({ success: true, data: mockInterviews[index], message: '面试反馈已提交' });
  } catch (error) {
    res.status(500).json({ success: false, error: '提交面试反馈失败' });
  }
});

router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: mockAnalyticsData as AnalyticsData });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取分析数据失败' });
  }
});

export default router;
