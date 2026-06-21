import { Router, type Request, type Response } from 'express';
import type {
  AdminReviewDashboard,
  ReviewItem,
  Company,
  VerificationRecord,
  Job,
} from '../../shared/types.js';
import {
  mockAdminDashboard,
  mockCompanies,
  mockVerificationRecords,
  mockJobs,
} from '../mock/data.js';

const router = Router();

router.get('/review/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingCompanies = mockCompanies.filter(c => c.status === 'pending').length;
    const pendingJobs = mockJobs.filter(j => j.reviewStatus === 'pending').length;
    const dashboard: AdminReviewDashboard = {
      ...mockAdminDashboard,
      pendingCompanyReviews: pendingCompanies,
      pendingJobReviews: pendingJobs,
    };
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取审核仪表盘失败' });
  }
});

router.get('/review/companies', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    let companies = [...mockCompanies];
    if (status && typeof status === 'string') {
      companies = companies.filter(c => c.status === status);
    }
    const companiesWithVerification = companies.map(company => {
      const verification = mockVerificationRecords.find(v => v.companyId === company.id);
      return {
        company,
        verification,
      };
    });
    res.status(200).json({ success: true, data: companiesWithVerification });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公司审核列表失败' });
  }
});

router.post('/review/companies/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body as { action: 'approve' | 'reject'; reason?: string };
    const companyIndex = mockCompanies.findIndex(c => c.id === id);
    if (companyIndex === -1) {
      res.status(404).json({ success: false, error: '公司不存在' });
      return;
    }
    mockCompanies[companyIndex].status = action === 'approve' ? 'verified' : 'rejected';
    if (action === 'approve') {
      mockCompanies[companyIndex].verifiedAt = new Date().toISOString();
    }
    const verIndex = mockVerificationRecords.findIndex(v => v.companyId === id);
    if (verIndex !== -1) {
      mockVerificationRecords[verIndex].status = action === 'approve' ? 'approved' : 'rejected';
    }
    res.status(200).json({
      success: true,
      data: mockCompanies[companyIndex],
      message: action === 'approve' ? '公司认证已通过' : '公司认证已拒绝',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '审核公司失败' });
  }
});

router.get('/review/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    let jobs = [...mockJobs];
    if (status && typeof status === 'string') {
      jobs = jobs.filter(j => j.reviewStatus === status);
    } else {
      jobs = jobs.filter(j => j.reviewStatus === 'pending');
    }
    const jobsWithCompany = jobs.map(job => {
      const company = mockCompanies.find(c => c.id === job.companyId);
      return {
        job,
        company,
      };
    });
    res.status(200).json({ success: true, data: jobsWithCompany });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取职位审核列表失败' });
  }
});

router.post('/review/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body as { action: 'approve' | 'reject'; reason?: string };
    const jobIndex = mockJobs.findIndex(j => j.id === id);
    if (jobIndex === -1) {
      res.status(404).json({ success: false, error: '职位不存在' });
      return;
    }
    mockJobs[jobIndex].reviewStatus = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'approve' && mockJobs[jobIndex].status === 'draft') {
      mockJobs[jobIndex].status = 'published';
    }
    res.status(200).json({
      success: true,
      data: mockJobs[jobIndex],
      message: action === 'approve' ? '职位审核已通过' : '职位审核已拒绝',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '审核职位失败' });
  }
});

export default router;
