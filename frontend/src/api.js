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
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me')
};

export const packageAPI = {
  getAll: () => api.get('/packages'),
  getPublished: () => api.get('/packages/published'),
  get: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.put(`/packages/${id}`, data),
  publish: (id) => api.post(`/packages/${id}/publish`),
  unpublish: (id) => api.post(`/packages/${id}/unpublish`),
  delete: (id) => api.delete(`/packages/${id}`)
};

export const timeslotAPI = {
  getAll: (date) => api.get('/timeslots', { params: { date } }),
  getAvailable: (date, packageId) => api.get('/timeslots/available', { params: { date, package_id: packageId } }),
  create: (data) => api.post('/timeslots', data)
};

export const appointmentAPI = {
  getAll: (status, date) => api.get('/appointments', { params: { status, date } }),
  getByPhone: (phone) => api.get(`/appointments/customer/${phone}`),
  get: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  pay: (id) => api.post(`/appointments/${id}/pay`),
  checkin: (id) => api.post(`/appointments/${id}/checkin`),
  reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
  cancel: (id, reason) => api.post(`/appointments/${id}/cancel`, { reason }),
  markNoShow: (id) => api.post(`/appointments/${id}/noshow`),
  refund: (id) => api.post(`/appointments/${id}/refund`)
};

export const checkupAPI = {
  getByAppointment: (appointmentId) => api.get(`/checkup/appointment/${appointmentId}`),
  sample: (id) => api.post(`/checkup/${id}/sample`),
  recordResult: (id, data) => api.post(`/checkup/${id}/result`, data),
  skip: (id, reason) => api.post(`/checkup/${id}/skip`, { reason })
};

export const reportAPI = {
  getAll: (status) => api.get('/reports', { params: { status } }),
  getByAppointment: (appointmentId) => api.get(`/reports/appointment/${appointmentId}`),
  getByCustomer: (phone) => api.get(`/reports/customer/${phone}`),
  generate: (appointmentId) => api.post(`/reports/generate/${appointmentId}`),
  update: (id, data) => api.put(`/reports/${id}`, data),
  submit: (id) => api.post(`/reports/${id}/submit`),
  reject: (id, comment) => api.post(`/reports/${id}/reject`, { review_comment: comment }),
  approve: (id) => api.post(`/reports/${id}/approve`),
  getAlerts: () => api.get('/reports/alerts'),
  markAlertRead: (id) => api.post(`/reports/alerts/${id}/read`),
  getStats: () => api.get('/reports/dashboard/stats')
};

export default api;
