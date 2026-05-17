import request from '../utils/request';
import {
  User,
  SleepRecord,
  SleepStats,
  SleepSummary,
  SleepMusic,
  Post,
  Comment,
  UserPreferences,
  LoginRequest,
  RegisterRequest
} from '../types';

export const authAPI = {
  login: (data: LoginRequest) => request.post<{ token: string; user: User }>('/auth/login', data),
  register: (data: RegisterRequest) => request.post<{ token: string; user: User }>('/auth/register', data)
};

export const sleepAPI = {
  getRecords: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
    request.get<{ records: SleepRecord[]; total: number; page: number; limit: number }>('/sleep/records', { params }),
  getRecord: (id: number) =>
    request.get<{ record: SleepRecord; peerComparison: SleepSummary }>(`/sleep/records/${id}`),
  createRecord: (data: Partial<SleepRecord>) =>
    request.post<{ id: number }>('/sleep/records', data),
  getStats: (days?: number) =>
    request.get<{ stats: SleepStats[]; summary: SleepSummary }>('/sleep/stats', { params: { days } })
};

export const musicAPI = {
  getList: (params?: { category?: string; page?: number; limit?: number }) =>
    request.get<{ musicList: SleepMusic[]; total: number; page: number; limit: number }>('/music', { params }),
  getCategories: () => request.get<{ categories: { name: string; count: number }[] }>('/music/categories'),
  playMusic: (id: number) => request.post(`/music/${id}/play`)
};

export const postsAPI = {
  getList: (params?: { category?: string; page?: number; limit?: number; isOfficial?: boolean }) =>
    request.get<{ posts: Post[]; total: number; page: number; limit: number }>('/posts', { params }),
  getDetail: (id: number) => request.get<{ post: Post; comments: Comment[] }>(`/posts/${id}`),
  createPost: (data: { title: string; content: string; category: string }) =>
    request.post<{ id: number }>('/posts', data),
  addComment: (postId: number, content: string) =>
    request.post<{ id: number }>(`/posts/${postId}/comments`, { content }),
  likePost: (id: number) => request.post(`/posts/${id}/like`)
};

export const preferencesAPI = {
  getPreferences: () => request.get<{ preferences: UserPreferences; user: User }>('/preferences'),
  updatePreferences: (data: Partial<UserPreferences>) => request.put('/preferences', data),
  updateProfile: (data: Partial<User>) => request.put('/preferences/profile', data)
};
