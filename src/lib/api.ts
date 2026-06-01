import { useAuthStore } from '@/store/authStore';

const API_BASE = '/api';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const { requireAuth = false, headers, ...restOptions } = options;
  const token = useAuthStore.getState().token;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth && token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { ...defaultHeaders, ...headers },
      ...restOptions,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, error: '网络请求失败' };
  }
}

export const authApi = {
  register: (data: { email: string; password: string; role: string; name?: string; phone?: string }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getProfile: () =>
    apiRequest('/auth/profile', { requireAuth: true }),
  updateProfile: (data: any) =>
    apiRequest('/auth/profile', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(data),
    }),
};

export const jobsApi = {
  list: (params?: { job_type?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.job_type) query.set('job_type', params.job_type);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return apiRequest(`/jobs?${query.toString()}`);
  },
  my: () => apiRequest('/jobs/my', { requireAuth: true }),
  get: (id: string) => apiRequest(`/jobs/${id}`),
  create: (data: any) =>
    apiRequest('/jobs', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(data),
    }),
  apply: (id: string, cover_letter?: string) =>
    apiRequest(`/jobs/${id}/apply`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ cover_letter }),
    }),
  updateStatus: (id: string, status: string) =>
    apiRequest(`/jobs/${id}/status`, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify({ status }),
    }),
  updateApplicationStatus: (applicationId: string, status: string) =>
    apiRequest(`/jobs/applications/${applicationId}/status`, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify({ status }),
    }),
  recommendations: () => apiRequest('/jobs/match/recommendations', { requireAuth: true }),
  myApplications: () => apiRequest('/jobs/applications/my', { requireAuth: true }),
};

export const skillsApi = {
  list: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest(`/skills${query}`);
  },
  categories: () => apiRequest('/skills/categories'),
  my: () => apiRequest('/skills/my-skills', { method: 'POST', requireAuth: true }),
  add: (skill_id: string, proficiency_level?: number) =>
    apiRequest('/skills/add', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ skill_id, proficiency_level }),
    }),
  remove: (skillId: string) =>
    apiRequest(`/skills/remove/${skillId}`, {
      method: 'DELETE',
      requireAuth: true,
    }),
};

export const interviewsApi = {
  my: () => apiRequest('/interviews/my', { requireAuth: true }),
  create: (data: { application_id: string; scheduled_at: string; interview_type: string }) =>
    apiRequest('/interviews', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiRequest(`/interviews/${id}`, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify(data),
    }),
};

export const settlementsApi = {
  my: () => apiRequest('/settlements/my', { requireAuth: true }),
  confirm: (contractId: string) =>
    apiRequest(`/settlements/${contractId}/confirm`, {
      method: 'POST',
      requireAuth: true,
    }),
  complete: (id: string) =>
    apiRequest(`/settlements/${id}/complete`, {
      method: 'POST',
      requireAuth: true,
    }),
};

export const adminApi = {
  stats: () => apiRequest('/admin/stats', { requireAuth: true }),
  users: (role?: string) => {
    const query = role ? `?role=${role}` : '';
    return apiRequest(`/admin/users${query}`, { requireAuth: true });
  },
  updateUserStatus: (id: string, status: string) =>
    apiRequest(`/admin/users/${id}/status`, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify({ status }),
    }),
  disputes: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest(`/admin/disputes${query}`, { requireAuth: true });
  },
  resolveDispute: (id: string, status: string, resolution: string) =>
    apiRequest(`/admin/disputes/${id}`, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify({ status, resolution }),
    }),
};
