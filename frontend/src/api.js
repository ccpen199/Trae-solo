import axios from 'axios';

const API_BASE = '/api';
const CURRENT_USER = 'user_biz';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': CURRENT_USER
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const setCurrentUser = (userId) => {
  api.defaults.headers['X-User-Id'] = userId;
};

export const interviews = {
  list: (params = {}) => api.get('/interviews', { params }),
  get: (id) => api.get(`/interviews/${id}`),
  getFull: (id) => api.get(`/interviews/${id}/full`),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  delete: (id) => api.delete(`/interviews/${id}`),
  getAudit: (id) => api.get(`/interviews/${id}/audit`),
  batchStatus: (ids, status, reason) => 
    api.post('/interviews/batch-status', { ids, status, reason })
};

export const transcripts = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/transcripts`),
  create: (interviewId, data) => api.post(`/interviews/${interviewId}/transcripts`, data),
  update: (interviewId, id, data) => 
    api.put(`/interviews/${interviewId}/transcripts/${id}`, data),
  addSegment: (interviewId, transcriptId, data) => 
    api.post(`/interviews/${interviewId}/transcripts/${transcriptId}/segments`, data),
  updateSegment: (interviewId, segmentId, data) => 
    api.put(`/interviews/${interviewId}/transcripts/segments/${segmentId}`, data)
};

export const speakers = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/speakers`),
  create: (interviewId, data) => api.post(`/interviews/${interviewId}/speakers`, data),
  update: (interviewId, id, data) => 
    api.put(`/interviews/${interviewId}/speakers/${id}`, data),
  delete: (interviewId, id) => 
    api.delete(`/interviews/${interviewId}/speakers/${id}`)
};

export const topics = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/topics`),
  create: (interviewId, data) => api.post(`/interviews/${interviewId}/topics`, data),
  update: (interviewId, id, data) => 
    api.put(`/interviews/${interviewId}/topics/${id}`, data),
  delete: (interviewId, id) => 
    api.delete(`/interviews/${interviewId}/topics/${id}`),
  cluster: (interviewId, topics) => 
    api.post(`/interviews/${interviewId}/topics/cluster`, { topics })
};

export const painPoints = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/pain-points`),
  create: (interviewId, data) => api.post(`/interviews/${interviewId}/pain-points`, data),
  update: (interviewId, id, data) => 
    api.put(`/interviews/${interviewId}/pain-points/${id}`, data),
  delete: (interviewId, id) => 
    api.delete(`/interviews/${interviewId}/pain-points/${id}`)
};

export const evidence = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/evidence`),
  create: (interviewId, data) => api.post(`/interviews/${interviewId}/evidence`, data),
  update: (interviewId, id, data) => 
    api.put(`/interviews/${interviewId}/evidence/${id}`, data),
  delete: (interviewId, id) => 
    api.delete(`/interviews/${interviewId}/evidence/${id}`)
};

export const summaries = {
  list: (interviewId) => api.get(`/interviews/${interviewId}/summaries`),
  create: (interviewId, data) => api.post(`/interviews/${interviewId}/summaries`, data),
  update: (interviewId, id, data) => 
    api.put(`/interviews/${interviewId}/summaries/${id}`, data)
};

export const workflow = {
  list: (params = {}) => api.get('/workflow', { params }),
  get: (id) => api.get(`/workflow/${id}`),
  create: (data) => api.post('/workflow', data),
  update: (id, data) => api.put(`/workflow/${id}`, data),
  generate: (interviewId) => api.post('/workflow/generate', { interview_id: interviewId })
};

export const users = {
  list: () => api.get('/users'),
  me: () => api.get('/users/me'),
  roles: () => api.get('/users/roles')
};

export const upload = {
  audio: (interviewId, file, onProgress) => {
    const formData = new FormData();
    formData.append('audio', file);
    return api.post(`/interviews/${interviewId}/upload/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    });
  },
  getStatus: (interviewId) => api.get(`/interviews/${interviewId}/upload/status`)
};

export const health = () => api.get('/health');

export default api;
