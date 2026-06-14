import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
};

export const jobsAPI = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  myJobs: () => api.get('/jobs/company/my')
};

export const companiesAPI = {
  list: (params) => api.get('/companies', { params }),
  get: (id) => api.get(`/companies/${id}`),
  getCredit: (id) => api.get(`/companies/${id}/credit`),
  review: (data) => api.post('/companies/review', data)
};

export const applicationsAPI = {
  create: (data) => api.post('/applications', data),
  myApplications: () => api.get('/applications/seeker/my'),
  companyApplications: () => api.get('/applications/company/my'),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status })
};

export const interviewsAPI = {
  create: (data) => api.post('/interviews', data),
  get: (id) => api.get(`/interviews/${id}`),
  list: (params) => api.get('/interviews', { params }),
  confirm: (id, confirmed) => api.put(`/interviews/${id}/confirm`, { confirmed }),
  myCompanyInterviews: () => api.get('/interviews/company/my'),
  mySeekerInterviews: () => api.get('/interviews/seeker/my')
};

export const reviewsAPI = {
  create: (data) => api.post('/companies/review', data),
  list: (params) => api.get('/reviews', { params })
};

export const voiceAPI = {
  search: (voice_text) => api.post('/voice/search', { voice_text }),
  arNavigate: (data) => api.post('/voice/ar/navigate', data)
};

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  opinions: (params) => api.get('/admin/opinions', { params }),
  opinionKeywords: () => api.get('/admin/opinions/keywords'),
  scanOpinions: () => api.post('/admin/opinions/scan'),
  suspiciousJobs: () => api.get('/admin/suspicious-jobs'),
  updateJobStatus: (id, status) => api.put(`/admin/jobs/${id}/status`, { status }),
  creditWarning: () => api.get('/admin/companies/credit-warning'),
  recordings: (params) => api.get('/admin/interviews/recordings', { params }),
  topSeekers: () => api.get('/admin/seekers/top-rated')
};
