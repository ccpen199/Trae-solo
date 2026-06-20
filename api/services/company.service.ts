import type { Company, CompanyQualification, VerificationStatus } from '@shared/types';
import { mockCompanies, mockCompanyQualifications } from '@shared/mock/data.js';

interface GetCompanyListParams {
  industry?: string;
  status?: VerificationStatus;
  page?: number;
  pageSize?: number;
}

interface CompanyWithQualification extends Company {
  qualification?: CompanyQualification;
}

export class CompanyService {
  static async getCompanyList(params: GetCompanyListParams): Promise<{ success: boolean; data?: { list: Company[]; total: number }; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let filtered = [...mockCompanies];

      if (params.industry) {
        filtered = filtered.filter(c => c.industry === params.industry);
      }

      if (params.status) {
        const companyIdsWithStatus = mockCompanyQualifications
          .filter(q => q.status === params.status)
          .map(q => q.companyId);
        filtered = filtered.filter(c => companyIdsWithStatus.includes(c.id));
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);

      return { success: true, data: { list, total } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '获取公司列表失败' };
    }
  }

  static async getCompanyById(id: string): Promise<{ success: boolean; data?: CompanyWithQualification; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const company = mockCompanies.find(c => c.id === id);
      if (!company) {
        return { success: false, error: '公司不存在' };
      }

      const qualification = mockCompanyQualifications.find(q => q.companyId === id);

      return { success: true, data: { ...company, qualification } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '获取公司详情失败' };
    }
  }

  static async getCompanyQualification(companyId: string): Promise<{ success: boolean; data?: CompanyQualification; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const qualification = mockCompanyQualifications.find(q => q.companyId === companyId);
      if (!qualification) {
        return { success: false, error: '公司资质不存在' };
      }

      return { success: true, data: qualification };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '获取公司资质失败' };
    }
  }

  static async updateCompanyQualificationStatus(id: string, status: VerificationStatus): Promise<{ success: boolean; data?: CompanyQualification; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      const index = mockCompanyQualifications.findIndex(q => q.id === id);
      if (index === -1) {
        return { success: false, error: '资质记录不存在' };
      }

      mockCompanyQualifications[index] = {
        ...mockCompanyQualifications[index],
        status,
        verifiedAt: status === 'approved' ? new Date() : undefined,
      };

      return { success: true, data: mockCompanyQualifications[index] };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '更新资质状态失败' };
    }
  }
}
