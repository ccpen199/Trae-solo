import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:59018')
  .replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const DEMO_TOKEN = 'local-demo-worker';
const DEMO_USER = {
  userId: 2,
  role: 'worker',
  name: '演示工友',
  phone: '13800000001',
  real_name_verified: 1,
  profile: { skills: '木工,钢筋工' }
};

function setDemoSession() {
  localStorage.setItem('token', DEMO_TOKEN);
  localStorage.setItem('user', JSON.stringify(DEMO_USER));
}

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
    const status = error.response?.status;
    const originalRequest = error.config || {};
    if ((status === 401 || status === 403) && !originalRequest.__demoRetry) {
      originalRequest.__demoRetry = true;
      setDemoSession();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${DEMO_TOKEN}`;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

export const jobsAPI = {
  getJobs: (params) => api.get('/api/jobs', { params }),
  getJobDetail: (id) => api.get(`/api/jobs/${id}`),
  createJob: (data) => api.post('/api/jobs', data),
  applyJob: (id) => api.post(`/api/jobs/${id}/apply`),
  getRecommendations: () => api.get('/api/jobs/matches/recommendations'),
  acceptMatch: (id) => api.post(`/api/jobs/matches/${id}/accept`),
};

export const attendanceAPI = {
  checkIn: (jobMatchId) => api.post('/api/attendance/check-in', { job_match_id: jobMatchId }),
  checkOut: (attendanceId) => api.post('/api/attendance/check-out', { attendance_id: attendanceId }),
  getMyAttendances: () => api.get('/api/attendance/my'),
  confirmAttendance: (id) => api.post(`/api/attendance/${id}/confirm`),
};

export const profileAPI = {
  getProfile: () => api.get('/api/profile'),
  updateWorker: (data) => api.put('/api/profile/worker', data),
  updateCompany: (data) => api.put('/api/profile/company', data),
  getMyJobs: () => api.get('/api/profile/my-jobs'),
};

export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getSafetyTips: () => api.get('/api/admin/safety/tips'),
  getDailyTip: () => api.get('/api/admin/safety/daily-tip'),
  getContractTemplates: () => api.get('/api/admin/contracts/templates'),
  getWorkers: () => api.get('/api/admin/workers'),
  getCompanies: () => api.get('/api/admin/companies'),
};

export default api;
