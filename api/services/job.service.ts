import type { JobDescription, Company, JobStatus, IndustryType } from '@shared/types';
import { mockJobs, mockCompanies, generateJobFromPainPoint } from '@shared/mock/data.js';
import { v4 as uuidv4 } from 'uuid';

interface GetJobListParams {
  industry?: string;
  status?: JobStatus;
  companyId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

interface JobWithCompany extends JobDescription {
  company?: Company;
}

export class JobService {
  static async getJobList(params: GetJobListParams): Promise<{ success: boolean; data?: { list: JobWithCompany[]; total: number }; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let filtered = [...mockJobs] as JobWithCompany[];

      if (params.industry) {
        filtered = filtered.filter(j => j.industry === params.industry);
      }

      if (params.status) {
        filtered = filtered.filter(j => j.status === params.status);
      }

      if (params.companyId) {
        filtered = filtered.filter(j => j.companyId === params.companyId);
      }

      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        filtered = filtered.filter(j =>
          j.title.toLowerCase().includes(keyword) ||
          j.description.toLowerCase().includes(keyword)
        );
      }

      filtered = filtered.map(job => {
        const company = mockCompanies.find(c => c.id === job.companyId);
        return { ...job, company };
      });

      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);

      return { success: true, data: { list, total } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '获取职位列表失败' };
    }
  }

  static async getJobById(id: string): Promise<{ success: boolean; data?: JobWithCompany; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const job = mockJobs.find(j => j.id === id);
      if (!job) {
        return { success: false, error: '职位不存在' };
      }

      const company = mockCompanies.find(c => c.id === job.companyId);

      return { success: true, data: { ...job, company } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '获取职位详情失败' };
    }
  }

  static async generateJD(painPoint: string): Promise<{ success: boolean; data?: Partial<JobDescription>; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const generated = generateJobFromPainPoint(painPoint);
      return { success: true, data: generated };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '生成职位描述失败' };
    }
  }

  static async createJob(jobData: Partial<JobDescription> & { companyId: string; title: string; industry: IndustryType }): Promise<{ success: boolean; data?: JobWithCompany; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      const company = mockCompanies.find(c => c.id === jobData.companyId);
      if (!company) {
        return { success: false, error: '公司不存在' };
      }

      const newJob: JobDescription = {
        id: `job-${uuidv4().slice(0, 8)}`,
        companyId: jobData.companyId,
        title: jobData.title,
        industry: jobData.industry,
        description: jobData.description || '',
        skillRadar: jobData.skillRadar || {
          professional: 70,
          communication: 70,
          service: 70,
          teamwork: 70,
          stress: 70,
          learning: 70,
        },
        scheduleFlexibility: jobData.scheduleFlexibility || 'fixed',
        salary: jobData.salary || {
          base: 5000,
          performance: 1000,
          commission: 500,
          benefits: ['五险一金', '节日福利'],
          currency: 'CNY',
        },
        location: jobData.location || company.address,
        geoLat: jobData.geoLat || company.geoLat,
        geoLng: jobData.geoLng || company.geoLng,
        requirements: jobData.requirements || [],
        benefits: jobData.benefits || ['五险一金', '带薪年假', '节日福利'],
        createdAt: new Date(),
        status: jobData.status || 'draft',
      };

      mockJobs.push(newJob);

      return { success: true, data: { ...newJob, company } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '创建职位失败' };
    }
  }

  static async updateJob(id: string, jobData: Partial<JobDescription>): Promise<{ success: boolean; data?: JobWithCompany; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      const index = mockJobs.findIndex(j => j.id === id);
      if (index === -1) {
        return { success: false, error: '职位不存在' };
      }

      mockJobs[index] = {
        ...mockJobs[index],
        ...jobData,
        updatedAt: new Date(),
      } as JobDescription;

      const company = mockCompanies.find(c => c.id === mockJobs[index].companyId);

      return { success: true, data: { ...mockJobs[index], company } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '更新职位失败' };
    }
  }

  static async publishJob(id: string): Promise<{ success: boolean; data?: JobWithCompany; error?: string }> {
    return this.updateJob(id, { status: 'published' } as any);
  }

  static async closeJob(id: string): Promise<{ success: boolean; data?: JobWithCompany; error?: string }> {
    return this.updateJob(id, { status: 'closed' } as any);
  }
}
