import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:56784';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const fingerprint = localStorage.getItem('device_fingerprint');
    if (fingerprint) {
      config.headers['X-Device-Fingerprint'] = fingerprint;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};

export const resumeAPI = {
  getMyResumes: () => api.get('/api/resumes'),
  getResume: (id) => api.get(`/api/resumes/${id}`),
  createResume: (data) => api.post('/api/resumes', data),
  updateResume: (id, data) => api.put(`/api/resumes/${id}`, data),
  listResumes: (params) => api.get('/api/resumes/list/all', { params }),
};

export const jobAPI = {
  getMyJobs: () => api.get('/api/jobs'),
  getJob: (id) => api.get(`/api/jobs/${id}`),
  createJob: (data) => api.post('/api/jobs', data),
  updateJob: (id, data) => api.put(`/api/jobs/${id}`, data),
  listJobs: (params) => api.get('/api/jobs/list/all', { params }),
  applyJob: (id, data) => api.post(`/api/jobs/${id}/apply`, data),
  getApplications: () => api.get('/api/jobs/applications/list'),
  updateApplicationStatus: (id, status) => api.put(`/api/jobs/applications/${id}/status`, { status }),
};

export const chatAPI = {
  getChats: () => api.get('/api/chat'),
  createChat: (data) => api.post('/api/chat', data),
  getMessages: (chatId, params) => api.get(`/api/chat/${chatId}/messages`, { params }),
  sendMessage: (chatId, data) => api.post(`/api/chat/${chatId}/messages`, data),
  uploadFile: (chatId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/chat/${chatId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const recAPI = {
  getRecommendedJobs: () => api.get('/api/recommendations/jobs'),
  getRecommendedResumes: () => api.get('/api/recommendations/resumes'),
  getExplore: (params) => api.get('/api/recommendations/explore', { params }),
};

export const liveAPI = {
  getRooms: (params) => api.get('/api/live', { params }),
  getRoom: (id) => api.get(`/api/live/${id}`),
  createRoom: (data) => api.post('/api/live', data),
  updateRoomStatus: (id, status) => api.put(`/api/live/${id}/status`, { status }),
  sendDanmaku: (id, content) => api.post(`/api/live/${id}/danmaku`, { content }),
  getDanmakus: (id) => api.get(`/api/live/${id}/danmakus`),
  incrementView: (id) => api.post(`/api/live/${id}/view`),
};

export const communityAPI = {
  getCommunities: (params) => api.get('/api/communities', { params }),
  joinCommunity: (id) => api.post(`/api/communities/${id}/join`),
  getPosts: (id, params) => api.get(`/api/communities/${id}/posts`, { params }),
  createPost: (id, data) => api.post(`/api/communities/${id}/posts`, data),
  getPost: (id) => api.get(`/api/communities/posts/${id}`),
  reportPost: (id, data) => api.post(`/api/communities/posts/${id}/report`, data),
};

export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getReports: (params) => api.get('/api/admin/reports', { params }),
  handleReport: (id, data) => api.put(`/api/admin/reports/${id}/handle`, data),
  getVerifications: (status) => api.get('/api/admin/companies/verifications', { params: { status } }),
  verifyCompany: (id, data) => api.put(`/api/admin/companies/${id}/verify`, data),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  updateUserStatus: (id, status) => api.put(`/api/admin/users/${id}/status`, { status }),
  getRiskUsers: () => api.get('/api/admin/risk/users'),
};
