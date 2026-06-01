import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

export const plansAPI = {
  getAll: () => api.get('/plans'),
  getOne: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  addChapter: (id, data) => api.post(`/plans/${id}/chapters`, data),
  join: (id) => api.post(`/plans/${id}/members`)
};

export const membersAPI = {
  getNotes: (params) => api.get('/members/notes', { params }),
  createNote: (data) => api.post('/members/notes', data),
  updateNote: (id, data) => api.put(`/members/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/members/notes/${id}`),
  getProgress: (params) => api.get('/members/progress', { params }),
  updateProgress: (data) => api.post('/members/progress', data),
  getCheckIns: (params) => api.get('/members/check-ins', { params }),
  createCheckIn: (data) => api.post('/members/check-ins', data)
};

export const discussionsAPI = {
  getTopics: (params) => api.get('/discussions/topics', { params }),
  getTopic: (id) => api.get(`/discussions/topics/${id}`),
  createTopic: (data) => api.post('/discussions/topics', data),
  deleteTopic: (id) => api.delete(`/discussions/topics/${id}`),
  addComment: (id, data) => api.post(`/discussions/topics/${id}/comments`, data),
  vote: (id, data) => api.post(`/discussions/topics/${id}/vote`, data),
  togglePin: (id, isPinned) => api.put(`/discussions/topics/${id}/pin`, { is_pinned: isPinned }),
  toggleEssence: (id, isEssence) => api.put(`/discussions/topics/${id}/essence`, { is_essence: isEssence })
};

export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getOne: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
  register: (id) => api.post(`/activities/${id}/register`),
  submitAssignment: (id, data) => api.post(`/activities/${id}/assignments`, data)
};

export const reportsAPI = {
  getParticipation: (planId) => api.get(`/reports/participation/${planId}`),
  getChapterProgress: (planId) => api.get(`/reports/chapter-progress/${planId}`),
  getHotTopics: (planId) => api.get(`/reports/hot-topics/${planId}`),
  getAbsenceAlerts: (planId) => api.get(`/reports/absence-alerts/${planId}`),
  getRetention: (planId) => api.get(`/reports/retention/${planId}`),
  getOverview: () => api.get('/reports/overview')
};

export default api;
