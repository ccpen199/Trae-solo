import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const jobsAPI = {
  getAll: () => api.get('/jobs'),
  create: (data) => api.post('/jobs', data),
  diagnose: (id) => api.get(`/jobs/${id}/diagnose`),
  publish: (id) => api.put(`/jobs/${id}/publish`),
  getAutoInvite: (id) => api.get(`/jobs/${id}/auto-invite`),
};

export const candidatesAPI = {
  getAll: () => api.get('/candidates'),
  create: (data) => api.post('/candidates', data),
  getById: (id) => api.get(`/candidates/${id}`),
  getSimilar: (id) => api.get(`/candidates/${id}/similar`),
  updateTags: (id, tags) => api.put(`/candidates/${id}/tags`, { tags }),
  search: (tags) => api.post('/candidates/search', { tags }),
  getEngagement: (id) => api.get(`/candidates/${id}/engagement`),
};

export const behaviorAPI = {
  track: (candidateId, jobId, action) =>
    api.post('/behavior/track', { candidate_id: candidateId, job_id: jobId, action }),
};

export const invitationsAPI = {
  create: (data) => api.post('/invitations', data),
  getByCandidate: (id) => api.get(`/invitations/candidate/${id}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/dashboard'),
  getChannels: () => api.get('/analytics/channels'),
  getTeam: () => api.get('/analytics/team'),
  addChannel: (data) => api.post('/channels', data),
  recordInterview: (data) => api.post('/interviews', data),
  updateInterviewResult: (id, data) => api.put(`/interviews/${id}/result`, data),
};

export const companyAPI = {
  getById: (id) => api.get(`/companies/${id}`),
  verify: (id, data) => api.put(`/companies/${id}/verify`, data),
};

export const hrisAPI = {
  getIntegrations: () => api.get('/hris/integrations'),
  connect: (data) => api.post('/hris/connect', data),
  sync: (provider) => api.post(`/hris/sync/${provider}`),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
