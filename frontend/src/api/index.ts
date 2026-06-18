import axios from 'axios';
import { message } from 'antd';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (window.location.pathname !== '/login') {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else if (error.message && !error.response) {
        message.error('网络连接异常，请稍后重试');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  register: (data: any) =>
    api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const workerApi = {
  list: (params?: any) => api.get('/workers', { params }).then((r) => r.data),
  detail: (id: string) => api.get(`/workers/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/workers', data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/workers/${id}`, data).then((r) => r.data),
  certificates: (id: string) => api.get(`/workers/${id}/certificates`).then((r) => r.data),
  addCertificate: (id: string, data: any) => api.post(`/workers/${id}/certificates`, data).then((r) => r.data),
};

export const employerApi = {
  list: (params?: any) => api.get('/employers', { params }).then((r) => r.data),
  detail: (id: string) => api.get(`/employers/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/employers', data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/employers/${id}`, data).then((r) => r.data),
};

export const orderApi = {
  list: (params?: any) => api.get('/orders', { params }).then((r) => r.data),
  detail: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/orders', data).then((r) => r.data),
  grab: (id: string) => api.post(`/orders/${id}/grab`).then((r) => r.data),
  accept: (id: string, worker_id: string) =>
    api.post(`/orders/${id}/accept`, { worker_id }).then((r) => r.data),
  checkin: (id: string, gps: any, face_verified: boolean) =>
    api.post(`/orders/${id}/checkin`, { gps, face_verified }).then((r) => r.data),
  completeNode: (orderId: string, nodeId: string, note?: string, image_url?: string) =>
    api.post(`/orders/${orderId}/nodes/${nodeId}/complete`, { note, image_url }).then((r) => r.data),
  complete: (id: string, actual_amount?: number) =>
    api.post(`/orders/${id}/complete`, { actual_amount }).then((r) => r.data),
  review: (id: string, rating: number, content?: string, tags?: string[]) =>
    api.post(`/orders/${id}/review`, { rating, content, tags }).then((r) => r.data),
  availableGrab: () => api.get('/orders/grab/available').then((r) => r.data),
};

export const trainingApi = {
  courses: (params?: any) => api.get('/training/courses', { params }).then((r) => r.data),
  courseDetail: (id: string) => api.get(`/training/courses/${id}`).then((r) => r.data),
  updateProgress: (courseId: string, progress: number) =>
    api.post(`/training/progress/${courseId}`, { progress }).then((r) => r.data),
  submitQuiz: (courseId: string, answers: Record<string, number>) =>
    api.post(`/training/quiz/${courseId}/submit`, { answers }).then((r) => r.data),
  myProgress: () => api.get('/training/my-progress').then((r) => r.data),
};

export const communityApi = {
  posts: (params?: any) => api.get('/community/posts', { params }).then((r) => r.data),
  postDetail: (id: string) => api.get(`/community/posts/${id}`).then((r) => r.data),
  createPost: (data: any) => api.post('/community/posts', data).then((r) => r.data),
  answerPost: (id: string, expert_answer: string) =>
    api.post(`/community/posts/${id}/answer`, { expert_answer }).then((r) => r.data),
  likePost: (id: string) => api.post(`/community/posts/${id}/like`).then((r) => r.data),
  commentPost: (id: string, content: string) =>
    api.post(`/community/posts/${id}/comments`, { content }).then((r) => r.data),
  hotTags: () => api.get('/community/hot-tags').then((r) => r.data),
  experts: () => api.get('/community/experts').then((r) => r.data),
};

export const supportApi = {
  policies: (params?: any) => api.get('/support/policies', { params }).then((r) => r.data),
  policyDetail: (id: string) => api.get(`/support/policies/${id}`).then((r) => r.data),
  createPolicy: (data: any) => api.post('/support/policies', data).then((r) => r.data),
  disputes: (params?: any) => api.get('/support/disputes', { params }).then((r) => r.data),
  disputeDetail: (id: string) => api.get(`/support/disputes/${id}`).then((r) => r.data),
  createDispute: (data: any) => api.post('/support/disputes', data).then((r) => r.data),
  processDispute: (id: string) => api.post(`/support/disputes/${id}/process`).then((r) => r.data),
  resolveDispute: (id: string, resolution: string) =>
    api.post(`/support/disputes/${id}/resolve`, { resolution }).then((r) => r.data),
  salaries: (params?: any) => api.get('/support/salaries', { params }).then((r) => r.data),
  paySalary: (id: string) => api.post(`/support/salaries/${id}/pay`).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  serviceGrids: (params?: any) => api.get('/admin/service-grids', { params }).then((r) => r.data),
  createGrid: (data: any) => api.post('/admin/service-grids', data).then((r) => r.data),
  updateGrid: (id: string, data: any) => api.put(`/admin/service-grids/${id}`, data).then((r) => r.data),
  conversionFunnel: (params?: any) => api.get('/admin/conversion-funnel', { params }).then((r) => r.data),
  generateFunnelData: () => api.post('/admin/generate-funnel-data').then((r) => r.data),
  approvalList: () => api.get('/admin/workers/approval-list').then((r) => r.data),
  approveWorker: (id: string) => api.post(`/admin/workers/${id}/approve`).then((r) => r.data),
  rejectWorker: (id: string) => api.post(`/admin/workers/${id}/reject`).then((r) => r.data),
  workerPerformance: (params?: any) => api.get('/admin/reports/worker-performance', { params }).then((r) => r.data),
};

export default api;
