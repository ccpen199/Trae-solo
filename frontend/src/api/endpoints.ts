import { get, post, put, del } from './index';
import type {
  User,
  Company,
  Job,
  Resume,
  CommunityPost,
  InterviewSchedule,
  CompanyCredit,
  SensitiveWord,
  Portfolio,
  PaginatedResponse,
  RecommendationResponse,
} from '../types';

export const auth = {
  login: (data: { email: string; password: string }) =>
    post<{ token: string; user: User }>('/auth/login', data),
  register: (data: { email: string; password: string; role: string; name?: string }) =>
    post<{ token: string; user: User }>('/auth/register', data),
  profile: () => get<User>('/auth/profile'),
};

export const jobs = {
  list: (params?: Record<string, any>) => get<PaginatedResponse<Job>>('/jobs', { params }),
  create: (data: any) => post<Job>('/jobs', data),
  getDetail: (id: number) => get<Job>(`/jobs/${id}`),
  update: (id: number, data: Partial<Job>) => put<Job>(`/jobs/${id}`, data),
  delete: (id: number) => del<void>(`/jobs/${id}`),
  recommend: (jobId: number, topN?: number) => post<RecommendationResponse>(`/jobs/${jobId}/recommend`, { topN }),
};

export const resumes = {
  list: (params?: Record<string, any>) => get<PaginatedResponse<Resume>>('/resume', { params }),
  getDetail: (id: number) => get<Resume>(`/resume/${id}`),
  parse: (resumeId: number) => post<{ success: boolean; message: string; data: any }>(`/resume/${resumeId}/parse`),
  getParseResult: (resumeId: number) => get<{ success: boolean; data: { resumeId: number; parseScore: number; parsedData: any; updatedAt: string } }>(`/resume/${resumeId}/parse-result`),
};

export const jobseeker = {
  resume: () => get<{ success: boolean; data: Resume }>('/jobseeker/resume'),
  updateResume: (data: any) => put<{ success: boolean; data: Resume }>('/jobseeker/resume', data),
  portfolio: () => get<{ success: boolean; data: Portfolio[] }>('/jobseeker/portfolio'),
  addPortfolio: (formData: FormData) =>
    post<{ success: boolean; data: Portfolio }>('/jobseeker/portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePortfolio: (id: number) => del<{ success: boolean }>(`/jobseeker/portfolio/${id}`),
  apply: (jobId: number) => post<{ success: boolean; data: any }>(`/jobseeker/apply/${jobId}`),
  applications: () => get<{ success: boolean; data: { job: Job; status: string; appliedAt: Date }[] }>('/jobseeker/applications'),
};

export const community = {
  posts: (params?: Record<string, any>) =>
    get<{ data: CommunityPost[]; total: number }>('/community/posts', { params }),
  createPost: (data: { title: string; content: string; tags?: string[]; images?: string[] }) =>
    post<CommunityPost>('/community/posts', data),
  postDetail: (id: number) => get<CommunityPost>(`/community/posts/${id}`),
  comment: (postId: number, content: string) =>
    post<{ id: number; content: string; createdAt: Date }>(`/community/posts/${postId}/comments`, { content }),
  like: (postId: number) => post<{ likes: number }>(`/community/posts/${postId}/like`),
};

export const interviews = {
  list: (params?: Record<string, any>) =>
    get<PaginatedResponse<InterviewSchedule>>('/interviews', { params }),
  create: (data: any) => post<InterviewSchedule>('/interviews', data),
  update: (id: number, data: Partial<InterviewSchedule>) =>
    put<InterviewSchedule>(`/interviews/${id}`, data),
  syncCalendar: (id: number) =>
    post<{ success: boolean; calendarEventId: string }>(`/interviews/${id}/sync-calendar`),
  getICS: (id: number) => get<string>(`/interviews/${id}/ics`),
};

export const admin = {
  enterprises: (params?: Record<string, any>) =>
    get<PaginatedResponse<Company>>('/admin/enterprises', { params }),
  enterpriseCredit: (companyId: number) => get<{ success: boolean; data: CompanyCredit }>(`/admin/enterprises/${companyId}/credit`),
  auditCompany: (companyId: number, status: string, reason?: string) =>
    post<{ success: boolean }>(`/admin/enterprises/${companyId}/audit`, { status, reason }),
  sensitiveWords: (params?: Record<string, any>) =>
    get<PaginatedResponse<SensitiveWord>>('/admin/sensitive-words', { params }),
  addSensitiveWord: (data: any) => post<{ success: boolean }>('/admin/sensitive-words', data),
  updateSensitiveWord: (id: number, data: any) => put<{ success: boolean }>(`/admin/sensitive-words/${id}`, data),
  deleteSensitiveWord: (id: number) => del<{ success: boolean }>(`/admin/sensitive-words/${id}`),
  statistics: () =>
    get<{
      success: boolean;
      data: {
        overview: {
          totalCompanies: number;
          approvedCompanies: number;
          pendingCompanies: number;
          totalJobseekers: number;
          totalJobs: number;
          activeJobs: number;
          totalResumes: number;
          totalPosts: number;
          totalMatches: number;
        };
        last30Days: {
          newCompanies: number;
          newJobseekers: number;
          newJobs: number;
          newMatches: number;
        };
        companyStatusDistribution: Array<{ name: string; value: number }>;
      };
    }>('/admin/statistics'),
  warnings: (params?: Record<string, any>) =>
    get<PaginatedResponse<any>>('/admin/warnings', { params }),
  handleWarning: (warningId: number, action: 'ignore' | 'delete' | 'warn') =>
    post<{ success: boolean }>(`/admin/warnings/${warningId}/handle`, { action }),
  jobseekers: (params?: Record<string, any>) =>
    get<PaginatedResponse<any>>('/admin/jobseekers', { params }),
};
