import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
      }
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const items = {
  getItems: (params) => api.get('/items', { params }),
  getItem: (id) => api.get(`/items/${id}`),
  createItem: (data) => api.post('/items', data),
  updateItem: (id, data) => api.put(`/items/${id}`, data),
  toggleItemStatus: (id, data) => api.put(`/items/${id}/status`, data),
};

export const cases = {
  getCases: (params) => api.get('/cases', { params }),
  getCase: (id) => api.get(`/cases/${id}`),
  submitCase: (data) => api.post('/cases', data),
  acceptCase: (id) => api.put(`/cases/${id}/accept`),
  reviewCase: (id, data) => api.put(`/cases/${id}/review`, data),
  supplementCase: (id, data) => api.put(`/cases/${id}/supplement`, data),
  completeCase: (id, data) => api.put(`/cases/${id}/complete`, data),
  archiveCase: (id) => api.put(`/cases/${id}/archive`),
  withdrawCase: (id) => api.put(`/cases/${id}/withdraw`),
};

export const certificates = {
  getCertificates: (params) => api.get('/certificates', { params }),
  getCertificate: (id) => api.get(`/certificates/${id}`),
  createCertificate: (data) => api.post('/certificates', data),
};

export const materials = {
  getMaterials: (params) => api.get('/materials', { params }),
  createMaterial: (data) => api.post('/materials', data),
  updateMaterial: (id, data) => api.put(`/materials/${id}`, data),
};

export const dashboard = {
  getStats: () => api.get('/dashboard/stats'),
  getTimeoutWarnings: () => api.get('/dashboard/timeout-warnings'),
  getTrend: () => api.get('/dashboard/trend'),
  getDepartmentStats: () => api.get('/dashboard/department-stats'),
};

export const departments = {
  getDepartments: () => api.get('/departments'),
  getDepartment: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post('/departments', data),
};

export const users = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  changePassword: (id, data) => api.put(`/users/${id}/password`, data),
};

export const notifications = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const evaluations = {
  getEvaluations: (params) => api.get('/evaluations', { params }),
  createEvaluation: (data) => api.post('/evaluations', data),
  replyEvaluation: (id, data) => api.put(`/evaluations/${id}/reply`, data),
};

export const search = {
  searchItems: (params) => api.get('/search', { params }),
  smartGuide: (params) => api.get('/search/guide', { params }),
  precheckItem: (id) => api.get(`/search/${id}/precheck`),
};

export default api;
