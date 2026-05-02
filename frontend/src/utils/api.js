import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      config.headers['X-User-Id'] = JSON.parse(user).id;
      config.headers['X-User-Role'] = JSON.parse(user).role;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => 
    api.post('/users/login', { username, password }),
};

export const vesselPlansAPI = {
  getAll: (params) => 
    api.get('/vessel-plans', { params }),
  getById: (id) => 
    api.get(`/vessel-plans/${id}`),
  create: (data) => 
    api.post('/vessel-plans', data),
  updateStatus: (id, data) => 
    api.put(`/vessel-plans/${id}/status`, data),
  getAvailableActions: (id, userRole) => 
    api.get(`/vessel-plans/${id}/available-actions`, { params: { user_role: userRole } }),
  getStatistics: () => 
    api.get('/vessel-plans/statistics/summary'),
};

export const containersAPI = {
  getAll: (params) => 
    api.get('/containers', { params }),
  getById: (id) => 
    api.get(`/containers/${id}`),
  create: (data) => 
    api.post('/containers', data),
  updateStatus: (id, data) => 
    api.put(`/containers/${id}/status`, data),
  arrival: (id, data) => 
    api.post(`/containers/${id}/arrival`, data),
  allocateYard: (id, data) => 
    api.post(`/containers/${id}/allocate-yard`, data),
  validate: (containerNo) => 
    api.get(`/containers/validate/${containerNo}`),
};

export const tasksAPI = {
  getAll: (params) => 
    api.get('/tasks', { params }),
  getById: (id) => 
    api.get(`/tasks/${id}`),
  create: (data) => 
    api.post('/tasks', data),
  updateStatus: (id, data) => 
    api.put(`/tasks/${id}/status`, data),
  start: (id, data) => 
    api.post(`/tasks/${id}/start`, data),
  complete: (id, data) => 
    api.post(`/tasks/${id}/complete`, data),
  getStatistics: (params) => 
    api.get('/tasks/statistics/summary', { params }),
};

export const gateAppointmentsAPI = {
  getAll: (params) => 
    api.get('/gate-appointments', { params }),
  getById: (id) => 
    api.get(`/gate-appointments/${id}`),
  create: (data) => 
    api.post('/gate-appointments', data),
  checkIn: (id, data) => 
    api.post(`/gate-appointments/${id}/check-in`, data),
  checkOut: (id, data) => 
    api.post(`/gate-appointments/${id}/check-out`, data),
  getAvailableGates: () => 
    api.get('/gate-appointments/gates/available'),
  lockGate: (gateNo, data) => 
    api.post(`/gate-appointments/gates/${gateNo}/lock`, data),
  unlockGate: (gateNo) => 
    api.post(`/gate-appointments/gates/${gateNo}/unlock`),
  getTodayStatistics: () => 
    api.get('/gate-appointments/statistics/today'),
};

export const yardAPI = {
  getAll: (params) => 
    api.get('/yard', { params }),
  getById: (id) => 
    api.get(`/yard/${id}`),
  findAvailable: (params) => 
    api.get('/yard/available/find', { params }),
  lock: (id) => 
    api.post(`/yard/${id}/lock`),
  unlock: (id) => 
    api.post(`/yard/${id}/unlock`),
  allocate: (data) => 
    api.post('/yard/allocate', data),
  release: (data) => 
    api.post('/yard/release', data),
  getOccupancyStatistics: () => 
    api.get('/yard/statistics/occupancy'),
  getByBayStatistics: () => 
    api.get('/yard/statistics/by-bay'),
};

export const exceptionsAPI = {
  getAll: (params) => 
    api.get('/exceptions', { params }),
  getPending: () => 
    api.get('/exceptions/pending'),
  getById: (id) => 
    api.get(`/exceptions/${id}`),
  create: (data) => 
    api.post('/exceptions', data),
  resolve: (id, data) => 
    api.put(`/exceptions/${id}/resolve`, data),
  getStatistics: () => 
    api.get('/exceptions/statistics/summary'),
};

export const messagesAPI = {
  getAll: (params) => 
    api.get('/messages', { params }),
  getUnreadCount: (recipientId) => 
    api.get('/messages/unread/count', { params: { recipient_id: recipientId } }),
  getById: (id) => 
    api.get(`/messages/${id}`),
  create: (data) => 
    api.post('/messages', data),
  markAsRead: (id) => 
    api.put(`/messages/${id}/read`),
  markBatchAsRead: (data) => 
    api.put('/messages/read/batch', data),
};

export const usersAPI = {
  getAll: (params) => 
    api.get('/users', { params }),
  getById: (id) => 
    api.get(`/users/${id}`),
  create: (data) => 
    api.post('/users', data),
  update: (id, data) => 
    api.put(`/users/${id}`, data),
};

export const dashboardAPI = {
  getSummary: () => 
    api.get('/dashboard/summary'),
};

export const healthAPI = {
  check: () => 
    api.get('/health'),
};

export default api;
