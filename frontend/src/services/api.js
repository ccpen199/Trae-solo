import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const courseApi = {
  getAll: (params) => api.get('/courses', { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  publish: (id) => api.post(`/courses/${id}/publish`),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const enrollmentApi = {
  getAll: (params) => api.get('/enrollments', { params }),
  enroll: (data) => api.post('/enrollments', data),
  drop: (id, reason) => api.post(`/enrollments/${id}/drop`, { reason }),
  pay: (id, paymentMethod) => api.post(`/enrollments/${id}/pay`, { payment_method: paymentMethod }),
  getSchedule: (studentId) => api.get(`/enrollments/schedule/${studentId}`),
};

export const attendanceApi = {
  getByCourse: (courseId, date) => api.get(`/attendance/course/${courseId}`, { params: { date } }),
  saveBatch: (courseId, date, records) => api.post(`/attendance/course/${courseId}/batch`, { date, records }),
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
  notify: (id) => api.post(`/attendance/${id}/notify`),
};

export const orderApi = {
  getAll: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  pay: (id, paymentMethod) => api.post(`/orders/${id}/pay`, { payment_method: paymentMethod }),
  audit: (id, action, notes) => api.post(`/orders/${id}/audit`, { action, notes }),
  getReport: (params) => api.get('/orders/reports/summary', { params }),
};

export const commonApi = {
  getGrades: () => api.get('/grades'),
  getClassrooms: () => api.get('/classrooms'),
  getTeachers: () => api.get('/teachers'),
  getStudents: (gradeId) => api.get('/students', { params: { grade_id: gradeId } }),
  getNotifications: (read) => api.get('/notifications', { params: { read } }),
  markNotificationRead: (id) => api.post(`/notifications/${id}/read`),
  getStats: () => api.get('/dashboard/stats'),
  getHealth: () => api.get('/health'),
};

export default api;
