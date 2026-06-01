import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:56896/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getAssessments: (id) => api.get(`/suppliers/${id}/assessments`)
};

export const questionnairesAPI = {
  getAll: () => api.get('/questionnaires'),
  getById: (id) => api.get(`/questionnaires/${id}`),
  getQuestions: (id) => api.get(`/questionnaires/${id}/questions`),
  create: (data) => api.post('/questionnaires', data),
  createQuestion: (id, data) => api.post(`/questionnaires/${id}/questions`, data),
  updateQuestion: (id, data) => api.put(`/questionnaires/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questionnaires/questions/${id}`)
};

export const assessmentsAPI = {
  getAll: (params) => api.get('/assessments', { params }),
  getById: (id) => api.get(`/assessments/${id}`),
  getAnswers: (id) => api.get(`/assessments/${id}/answers`),
  getSummary: (id) => api.get(`/assessments/${id}/summary`),
  create: (data) => api.post('/assessments', data),
  updateAnswer: (assessmentId, answerId, data) => 
    api.post(`/assessments/${assessmentId}/answers/${answerId}`, data),
  submit: (id) => api.post(`/assessments/${id}/submit`),
  approve: (id) => api.post(`/assessments/${id}/approve`)
};

export const evidencesAPI = {
  getAll: (params) => api.get('/evidences', { params }),
  getById: (id) => api.get(`/evidences/${id}`),
  upload: (formData) => api.post('/evidences', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, status) => api.put(`/evidences/${id}/status`, { status }),
  delete: (id) => api.delete(`/evidences/${id}`)
};

export const rectificationsAPI = {
  getAll: (params) => api.get('/rectifications', { params }),
  getById: (id) => api.get(`/rectifications/${id}`),
  create: (data) => api.post('/rectifications', data),
  update: (id, data) => api.put(`/rectifications/${id}`, data),
  submit: (id, data) => api.post(`/rectifications/${id}/submit`, data),
  approve: (id) => api.post(`/rectifications/${id}/approve`),
  delete: (id) => api.delete(`/rectifications/${id}`)
};

export const reportsAPI = {
  getSupplierGrading: () => api.get('/reports/supplier-grading'),
  getStatistics: () => api.get('/reports/statistics'),
  getAcceptanceChecklist: () => api.get('/reports/acceptance-checklist')
};

export default api;
