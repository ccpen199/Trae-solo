import type { TalentProfile, Certificate, JobDescription, MatchResult, IndustryType } from '@shared/types';
import { mockTalents, mockJobs, calculateMatchScore } from '@shared/mock/data';
import { v4 as uuidv4 } from 'uuid';

export interface TalentListParams {
  page?: number;
  pageSize?: number;
  industry?: string;
  keyword?: string;
  minExperience?: number;
  maxExpectedSalary?: number;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  experienceYears?: number;
  serviceScenarios?: string[];
  skillRadar?: TalentProfile['skillRadar'];
  preferredIndustries?: IndustryType[];
  expectedSalary?: number;
  currentLocation?: string;
  geoLat?: number;
  geoLng?: number;
  tags?: string[];
  videoResumeUrl?: string;
}

export interface UploadCertificateData {
  name: string;
  issuer: string;
  issueDate: Date;
  expireDate?: Date;
}

export class TalentService {
  static async getTalentList(params: TalentListParams = {}): Promise<{ list: TalentProfile[]; total: number }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...mockTalents];

    if (params.industry) {
      filtered = filtered.filter(t => t.preferredIndustries.includes(params.industry as any));
    }

    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(keyword) ||
        t.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
        t.serviceScenarios.some(s => s.toLowerCase().includes(keyword))
      );
    }

    if (params.minExperience !== undefined) {
      filtered = filtered.filter(t => t.experienceYears >= params.minExperience!);
    }

    if (params.maxExpectedSalary !== undefined) {
      filtered = filtered.filter(t => t.expectedSalary <= params.maxExpectedSalary!);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total: filtered.length };
  }

  static async getTalentById(id: string): Promise<TalentProfile & { certificates: Certificate[] } | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const talent = mockTalents.find(t => t.id === id);
    if (!talent) return null;

    return { ...talent, certificates: talent.certificates };
  }

  static async updateTalentProfile(id: string, profileData: UpdateProfileData): Promise<TalentProfile | null> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = mockTalents.findIndex(t => t.id === id);
    if (index === -1) return null;

    mockTalents[index] = { ...mockTalents[index], ...profileData };
    return mockTalents[index];
  }

  static async uploadCertificate(talentId: string, certificateData: UploadCertificateData): Promise<Certificate | null> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const talent = mockTalents.find(t => t.id === talentId);
    if (!talent) return null;

    const newCertificate: Certificate = {
      id: `cert-${uuidv4()}`,
      name: certificateData.name,
      issuer: certificateData.issuer,
      issueDate: new Date(certificateData.issueDate),
      expireDate: certificateData.expireDate ? new Date(certificateData.expireDate) : undefined,
      verified: false,
    };

    talent.certificates.push(newCertificate);
    return newCertificate;
  }

  static async getRecommendedJobs(talentId: string): Promise<MatchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const talent = mockTalents.find(t => t.id === talentId);
    if (!talent) return [];

    const results: MatchResult[] = mockJobs.map(job => calculateMatchScore(job, talent));
    return results.sort((a, b) => b.overallScore - a.overallScore);
  }
}
