import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
      localStorage.removeItem('role');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  lawyerRegister: (data) => api.post('/auth/lawyer/register', data),
  lawyerLogin: (data) => api.post('/auth/lawyer/login', data),
  userRegister: (data) => api.post('/auth/user/register', data),
  userLogin: (data) => api.post('/auth/user/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
};

export const lawyerAPI = {
  getPendingLawyers: () => api.get('/lawyers/pending'),
  verifyLawyer: (id, status) => api.put(`/lawyers/${id}/verify`, { status }),
  getLawyers: (params) => api.get('/lawyers', { params }),
  getLawyerDetail: (id) => api.get(`/lawyers/${id}`),
  getVerification: (id) => api.get(`/lawyers/${id}/verification`),
  submitOCR: (id) => api.post(`/lawyers/${id}/ocr`),
  barVerify: (id) => api.post(`/lawyers/${id}/bar-verify`),
  generateCreditReport: (id) => api.post(`/lawyers/${id}/credit-report`),
};

export const consultationAPI = {
  create: (data) => api.post('/consultations', data),
  list: (params) => api.get('/consultations', { params }),
  detail: (id) => api.get(`/consultations/${id}`),
  upgrade: (id, data) => api.put(`/consultations/${id}/upgrade`, data),
  escalate: (id, data) => api.post(`/consultations/${id}/escalate`, data),
  sendMessage: (id, content) => api.post(`/consultations/${id}/messages`, { content }),
  getMessages: (id) => api.get(`/consultations/${id}/messages`),
  submitNPS: (id, data) => api.post(`/consultations/${id}/submit-nps`, data),
  getAudit: (id) => api.get(`/consultations/${id}/audit`),
};

export const contractAPI = {
  generate: (data) => api.post('/contracts/generate', data),
  list: () => api.get('/contracts'),
};

export const caseAPI = {
  create: (data) => api.post('/cases', data),
  list: () => api.get('/cases'),
  getProgress: (id) => api.get(`/cases/${id}/progress`),
  updateProgress: (id, data) => api.put(`/cases/${id}/progress`, data),
};

export const adminAPI = {
  getAudits: () => api.get('/admin/audits'),
  processAudit: (id, status) => api.post(`/admin/audits/${id}/process`, { audit_status: status }),
  getNPS: () => api.get('/admin/nps'),
  getNPSDetail: () => api.get('/admin/nps-detail'),
  getComplianceReports: () => api.get('/admin/compliance'),
  generateComplianceReport: (data) => api.post('/admin/compliance/generate', data),
  getRevenueShares: () => api.get('/admin/revenue-shares'),
  getDocumentAnalyses: () => api.get('/document-analyses'),
  analyzeDocument: (data) => api.post('/document-analyses', data),
};

export const contentAPI = {
  getLiveStreams: () => api.get('/live-streams'),
  getShortVideos: () => api.get('/short-videos'),
  createLiveStream: (data) => api.post('/live-streams', data),
  createShortVideo: (data) => api.post('/short-videos', data),
  getRevenueShares: () => api.get('/revenue-shares'),
};

export const companyAPI = {
  list: () => api.get('/companies'),
  create: (data) => api.post('/companies', data),
  getSOPs: (id) => api.get(`/companies/${id}/sops`),
  createSOP: (id, data) => api.post(`/companies/${id}/sops`, data),
  getCourses: (id) => api.get(`/companies/${id}/courses`),
  createCourse: (id, data) => api.post(`/companies/${id}/courses`, data),
  getTickets: (id) => api.get(`/companies/${id}/tickets`),
  createTicket: (id, data) => api.post(`/companies/${id}/tickets`, data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const seedAPI = {
  seedData: () => api.post('/seed-data'),
};
