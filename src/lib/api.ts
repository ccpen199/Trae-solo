import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  AuthResponse,
  Certification,
  CertificationCard,
  CompetencyModel,
  CreateFollowUpRequest,
  DiagnosisReport,
  EncyclopediaEntry,
  EncyclopediaJobCard,
  FollowUpReminder,
  Interview,
  InterviewCard,
  JobFilters,
  JobPost,
  JobWarning,
  LoginRequest,
  PaginatedResponse,
  PaginationParams,
  PromotionPath,
  RegisterRequest,
  SelfAssessment,
  TagTalentRequest,
  TalentPoolEntry,
  UserProfile,
} from '@shared/types';

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      let message = '请求失败，请稍后重试';

      if (status === 401) {
        message = '登录已过期，请重新登录';
        localStorage.removeItem('auth_token');
      } else if (status === 403) {
        message = '无权限访问该资源';
      } else if (status === 404) {
        message = '请求的资源不存在';
      } else if (status === 500) {
        message = '服务器内部错误';
      }

      if (typeof data === 'object' && data !== null && 'message' in data) {
        message = (data as { message: string }).message;
      }

      return Promise.reject(new ApiError(message, status, data));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('请求超时，请检查网络连接', 0));
    }

    return Promise.reject(new ApiError('网络错误，请检查网络连接', 0));
  }
);

const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.get<T>(url, config).then((res) => res.data),
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.post<T>(url, data, config).then((res) => res.data),
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.put<T>(url, data, config).then((res) => res.data),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    axiosInstance.delete<T>(url, config).then((res) => res.data),
};

export const competencyApi = {
  getCompetencyJobs: (
    params?: PaginationParams & { keyword?: string; industry?: string }
  ): Promise<PaginatedResponse<{ id: string; name: string; industry: string; level: string }>> =>
    request.get('/competency-graph/jobs', { params }),

  getCompetencyJobDetail: (id: string): Promise<CompetencyModel> =>
    request.get(`/competency-graph/jobs/${id}`),

  getIndustries: (): Promise<{ id: string; name: string; children?: { id: string; name: string }[] }[]> =>
    request.get('/competency-graph/industries'),

  getPromotionPath: (jobId: string): Promise<PromotionPath> =>
    request.get(`/competency-graph/promotion-path/${jobId}`),
};

export const diagnosisApi = {
  postDiagnosisAssess: (assessment: SelfAssessment): Promise<DiagnosisReport> =>
    request.post('/diagnosis/assess', assessment),

  getDiagnosisHistory: (
    params?: PaginationParams
  ): Promise<PaginatedResponse<DiagnosisReport>> =>
    request.get('/diagnosis/history', { params }),
};

export const jobsApi = {
  getJobs: (
    params?: PaginationParams & JobFilters
  ): Promise<PaginatedResponse<JobPost>> =>
    request.get('/jobs', { params }),

  getJobDetail: (id: string): Promise<JobPost> =>
    request.get(`/jobs/${id}`),

  getRecommendJobs: (
    params?: PaginationParams
  ): Promise<PaginatedResponse<JobPost>> =>
    request.get('/jobs/recommend', { params }),
};

export const encyclopediaApi = {
  getJobs: (
    params?: PaginationParams & { keyword?: string; category?: string; industry?: string }
  ): Promise<PaginatedResponse<EncyclopediaJobCard>> =>
    request.get('/encyclopedia/jobs', { params }),

  getEncyclopediaJobs: (
    params?: PaginationParams & { keyword?: string; category?: string }
  ): Promise<PaginatedResponse<{ id: string; name: string; category: string; overview: string }>> =>
    request.get('/encyclopedia/jobs', { params }),

  getJobById: (id: string): Promise<EncyclopediaEntry> =>
    request.get(`/encyclopedia/jobs/${id}`),

  getEncyclopediaJobDetail: (id: string): Promise<EncyclopediaEntry> =>
    request.get(`/encyclopedia/jobs/${id}`),

  getInterviews: (
    params?: PaginationParams & { jobId?: string }
  ): Promise<PaginatedResponse<InterviewCard>> =>
    request.get('/encyclopedia/interviews', { params }),

  getInterviewList: (
    params?: PaginationParams & { jobId?: string }
  ): Promise<PaginatedResponse<Interview>> =>
    request.get('/encyclopedia/interviews', { params }),

  getCertifications: (
    params?: PaginationParams & { jobId?: string }
  ): Promise<PaginatedResponse<CertificationCard>> =>
    request.get('/encyclopedia/certifications', { params }),
};

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    request.post('/auth/login', data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    request.post('/auth/register', data),
};

export const usersApi = {
  getProfile: (): Promise<UserProfile> =>
    request.get('/users/profile'),

  updateProfile: (data: Partial<UserProfile>): Promise<UserProfile> =>
    request.put('/users/profile', data),

  getGrowthTimeline: (
    params?: PaginationParams
  ): Promise<PaginatedResponse<UserProfile['growthTimeline'][number]>> =>
    request.get('/users/growth-timeline', { params }),
};

export const hrApi = {
  getHrTalentPool: (
    params?: PaginationParams & {
      potentialLevel?: string;
      status?: string;
      keyword?: string;
    }
  ): Promise<PaginatedResponse<TalentPoolEntry>> =>
    request.get('/hr/talent-pool', { params }),

  getHrTalentDetail: (id: string): Promise<TalentPoolEntry> =>
    request.get(`/hr/talent-pool/${id}`),

  postHrTalentTag: (id: string, data: TagTalentRequest): Promise<TalentPoolEntry> =>
    request.post(`/hr/talent-pool/${id}/tag`, data),

  createFollowUp: (data: CreateFollowUpRequest): Promise<FollowUpReminder> =>
    request.post('/hr/follow-ups', data),

  getHrDashboardStats: (): Promise<{
    totalTalents: number;
    newThisWeek: number;
    interviewsScheduled: number;
    offersSent: number;
    talentByLevel: { level: string; count: number }[];
    talentByStatus: { status: string; count: number }[];
  }> => request.get('/hr/dashboard/stats'),

  getHrWarnings: (
    params?: PaginationParams & { severity?: string; type?: string }
  ): Promise<PaginatedResponse<JobWarning>> =>
    request.get('/hr/warnings', { params }),
};

export { ApiError, axiosInstance, request };
export type { Certification };
