import type {
  User,
  University,
  Major,
  RecommendItem,
  VolunteerPlan,
  GenerateRecommendRequest,
  GenerateRecommendResponse,
  AnalyzePlanRequest,
  AnalyzePlanResponse,
  CollaborationSpace,
  CollaborationMember,
  DiscussionMessage,
  QAQuestion,
  QAAnswer,
  LiveSession,
  LiveReservation,
  ApiResponse,
  PaginatedResponse,
  GetAdmissionScoresResponse,
} from '../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
}

async function request<T = unknown>(config: RequestConfig): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${config.url}`;
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    method: config.method || 'GET',
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('未授权，请重新登录');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || '请求失败');
  }

  return data as T;
}

export const auth = {
  login: (phone: string, password: string) =>
    request<ApiResponse<{ token: string; user: User }>>({
      url: '/auth/login',
      method: 'POST',
      body: { phone, password },
    }),

  register: (data: { phone: string; password: string; role: string; name: string; province?: string; relationship?: string; schoolName?: string }) =>
    request<ApiResponse<{ token: string; user: User }>>({
      url: '/auth/register',
      method: 'POST',
      body: data,
    }),

  getCurrentUser: () =>
    request<ApiResponse<User>>({
      url: '/auth/me',
      method: 'GET',
    }),
};

export const university = {
  getList: (params?: Record<string, unknown>) =>
    request<PaginatedResponse<University>>({
      url: '/universities',
      method: 'GET',
      params,
    }),

  search: (params?: Record<string, unknown>) =>
    request<PaginatedResponse<University>>({
      url: '/universities',
      method: 'GET',
      params,
    }),

  getById: (id: number) =>
    request<ApiResponse<University>>({
      url: `/universities/${id}`,
      method: 'GET',
    }),

  getScores: (id: number, province?: string) =>
    request<GetAdmissionScoresResponse>({
      url: `/universities/${id}/scores`,
      method: 'GET',
      params: province ? { province } : undefined,
    }),

  getMajors: (id: number) =>
    request<ApiResponse<Major[]>>({
      url: `/universities/${id}/majors`,
      method: 'GET',
    }),

  compare: (ids: number[]) =>
    request<ApiResponse<University[]>>({
      url: '/universities/compare',
      method: 'POST',
      body: { ids },
    }),
};

export const major = {
  getList: (params?: Record<string, unknown>) =>
    request<PaginatedResponse<Major>>({
      url: '/majors',
      method: 'GET',
      params,
    }),

  getById: (id: number) =>
    request<ApiResponse<Major>>({
      url: `/majors/${id}`,
      method: 'GET',
    }),

  getByUniversity: (universityId: number) =>
    request<ApiResponse<Major[]>>({
      url: `/universities/${universityId}/majors`,
      method: 'GET',
    }),

  compare: (ids: number[]) =>
    request<ApiResponse<Major[]>>({
      url: '/majors/compare',
      method: 'POST',
      body: { ids },
    }),
};

export const recommend = {
  generate: (data: GenerateRecommendRequest) =>
    request<GenerateRecommendResponse>({
      url: '/recommend/generate',
      method: 'POST',
      body: data,
    }),

  analyze: (data: unknown) =>
    request<ApiResponse<unknown>>({
      url: '/recommend/analyze',
      method: 'POST',
      body: data,
    }),

  getProbability: (params: Record<string, unknown>) =>
    request<ApiResponse<{ probability: number }>>({
      url: '/recommend/probability',
      method: 'GET',
      params,
    }),
};

export const plan = {
  getList: () =>
    request<ApiResponse<VolunteerPlan[]>>({
      url: '/plans',
      method: 'GET',
    }),

  create: (data: { name: string; items: Array<{ universityId: number; majorId: number; order: number; tier: string }> }) =>
    request<ApiResponse<VolunteerPlan>>({
      url: '/plans',
      method: 'POST',
      body: data,
    }),

  getById: (id: number) =>
    request<ApiResponse<VolunteerPlan>>({
      url: `/plans/${id}`,
      method: 'GET',
    }),

  update: (id: number, data: Partial<VolunteerPlan>) =>
    request<ApiResponse<VolunteerPlan>>({
      url: `/plans/${id}`,
      method: 'PUT',
      body: data,
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>({
      url: `/plans/${id}`,
      method: 'DELETE',
    }),

  analyze: (id: number) =>
    request<AnalyzePlanResponse>({
      url: `/plans/${id}/analyze`,
      method: 'POST',
    }),

  export: (id: number) =>
    request<ApiResponse<{ url: string }>>({
      url: `/plans/${id}/export`,
      method: 'GET',
    }),
};

export const collaboration = {
  getSpaces: () =>
    request<ApiResponse<CollaborationSpace[]>>({
      url: '/collaboration/spaces',
      method: 'GET',
    }),

  createSpace: (data: { name: string; planId?: number }) =>
    request<ApiResponse<CollaborationSpace>>({
      url: '/collaboration/spaces',
      method: 'POST',
      body: data,
    }),

  getSpace: (id: number) =>
    request<ApiResponse<{ space: CollaborationSpace; members: CollaborationMember[]; messages: DiscussionMessage[]; plan?: VolunteerPlan }>>({
      url: `/collaboration/spaces/${id}`,
      method: 'GET',
    }),

  addMember: (spaceId: number, data: { userId: number; role: string }) =>
    request<ApiResponse<CollaborationMember>>({
      url: `/collaboration/spaces/${spaceId}/members`,
      method: 'POST',
      body: data,
    }),

  removeMember: (spaceId: number, userId: number) =>
    request<ApiResponse<void>>({
      url: `/collaboration/spaces/${spaceId}/members/${userId}`,
      method: 'DELETE',
    }),

  sendMessage: (spaceId: number, data: { content: string; itemId?: number }) =>
    request<ApiResponse<DiscussionMessage>>({
      url: `/collaboration/spaces/${spaceId}/messages`,
      method: 'POST',
      body: data,
    }),
};

export const qa = {
  getQuestions: (params?: Record<string, unknown>) =>
    request<PaginatedResponse<QAQuestion>>({
      url: '/qa/questions',
      method: 'GET',
      params,
    }),

  createQuestion: (data: { title: string; content: string; category?: string }) =>
    request<ApiResponse<QAQuestion>>({
      url: '/qa/questions',
      method: 'POST',
      body: data,
    }),

  getQuestion: (id: number) =>
    request<ApiResponse<{ question: QAQuestion; answers: Array<QAAnswer & { user: User }> }>>({
      url: `/qa/questions/${id}`,
      method: 'GET',
    }),

  createAnswer: (questionId: number, data: { content: string }) =>
    request<ApiResponse<QAAnswer>>({
      url: `/qa/questions/${questionId}/answers`,
      method: 'POST',
      body: data,
    }),

  likeAnswer: (id: number) =>
    request<ApiResponse<{ likeCount: number }>>({
      url: `/qa/answers/${id}/like`,
      method: 'POST',
    }),
};

export const live = {
  getUpcoming: () =>
    request<ApiResponse<Array<LiveSession & { expert: User }>>>({
      url: '/live/upcoming',
      method: 'GET',
    }),

  reserve: (id: number) =>
    request<ApiResponse<LiveReservation>>({
      url: `/live/${id}/reserve`,
      method: 'POST',
    }),

  getReservations: () =>
    request<ApiResponse<Array<LiveReservation & { session: LiveSession & { expert: User } }>>>({
      url: '/live/reservations',
      method: 'GET',
    }),
};

export const admissionScore = {
  getTrend: (universityId: number, majorId?: number, province?: string) =>
    request<ApiResponse<Array<{ year: number; major: Major; minScore: number; minRank?: number }>>>({
      url: '/admission-scores/trend',
      method: 'GET',
      params: { universityId, majorId, province },
    }),
};

export const admin = {
  getStatistics: () =>
    request<ApiResponse<{
      totalUsers: number;
      totalPlans: number;
      totalQuestions: number;
      totalLiveSessions: number;
      userRoleBreakdown: Record<string, number>;
      recentActivity: {
        last7DaysNewUsers: number;
        last7DaysNewPlans: number;
        last7DaysNewQuestions: number;
      };
    }>>({
      url: '/admin/statistics',
      method: 'GET',
    }),

  getHeatmap: (date?: string) =>
    request<ApiResponse<Array<{
      province: string;
      totalSearchCount: number;
      totalApplicationCount: number;
      universityBreakdown: Array<{
        universityId: number;
        universityName: string;
        searchCount: number;
        applicationCount: number;
      }>;
    }>>>({
      url: '/admin/heatmap',
      method: 'GET',
      params: date ? { date } : undefined,
    }),

  getPendingQuestions: () =>
    request<ApiResponse<Array<QAQuestion & { user: User }>>>({
      url: '/qa/questions',
      method: 'GET',
      params: { status: 'pending' },
    }),

  approveQuestion: (id: number) =>
    request<ApiResponse<QAQuestion>>({
      url: `/admin/questions/${id}/approve`,
      method: 'PUT',
    }),

  rejectQuestion: (id: number) =>
    request<ApiResponse<QAQuestion>>({
      url: `/admin/questions/${id}/reject`,
      method: 'PUT',
    }),

  desensitize: () =>
    request<ApiResponse<{ maskedCount: number; types: string[] }>>({
      url: '/admin/desensitize',
      method: 'POST',
    }),
};

export default { request, auth, university, major, recommend, plan, collaboration, qa, live, admin, admissionScore };
