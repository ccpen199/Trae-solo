import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
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

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout')
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  getUsers: (params) => api.get('/users', { params }),
  getStudents: (params) => api.get('/users/students/list', { params }),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export const scaleAPI = {
  getScales: () => api.get('/scales'),
  getScale: (id) => api.get(`/scales/${id}`),
  createScale: (data) => api.post('/scales', data),
  updateScale: (id, data) => api.put(`/scales/${id}`, data),
  deleteScale: (id) => api.delete(`/scales/${id}`)
};

export const planAPI = {
  getPlans: (params) => api.get('/plans', { params }),
  getPlan: (id) => api.get(`/plans/${id}`),
  createPlan: (data) => api.post('/plans', data),
  updatePlan: (id, data) => api.put(`/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/plans/${id}`),
  consent: (id, data) => api.post(`/plans/${id}/consent`, data),
  getConsentStatus: (id) => api.get(`/plans/${id}/consent-status`)
};

export const assessmentAPI = {
  getMyAssessments: () => api.get('/assessments/my-assessments'),
  getRecord: (id) => api.get(`/assessments/record/${id}`),
  saveProgress: (id, data) => api.post(`/assessments/record/${id}/save`, data),
  submitAssessment: (id, data) => api.post(`/assessments/record/${id}/submit`, data),
  getMyRecord: (planId) => api.get(`/assessments/plan/${planId}/my-record`),
  getPlanRecords: (planId, params) => api.get(`/assessments/plan/${planId}/records`, { params })
};

export const resultAPI = {
  getResults: (params) => api.get('/results', { params }),
  getResult: (id) => api.get(`/results/${id}`),
  getStudentHistory: (studentId) => api.get(`/results/student/${studentId}/history`),
  getRiskDistribution: (params) => api.get('/results/statistics/risk-distribution', { params }),
  getGradeComparison: () => api.get('/results/statistics/grade-comparison'),
  getAtRiskStudents: (params) => api.get('/results/at-risk-students', { params }),
  updateNotes: (id, data) => api.put(`/results/${id}/notes`, data)
};

export const interventionAPI = {
  getInterventions: (params) => api.get('/interventions', { params }),
  getIntervention: (id) => api.get(`/interventions/${id}`),
  createIntervention: (data) => api.post('/interventions', data),
  updateIntervention: (id, data) => api.put(`/interventions/${id}`, data),
  closeIntervention: (id) => api.post(`/interventions/${id}/close`),
  deleteIntervention: (id) => api.delete(`/interventions/${id}`)
};

export const todoAPI = {
  getMyTodos: (params) => api.get('/todos/my-todos', { params }),
  getTodos: (params) => api.get('/todos', { params }),
  getTodo: (id) => api.get(`/todos/${id}`),
  createTodo: (data) => api.post('/todos', data),
  updateTodo: (id, data) => api.put(`/todos/${id}`, data),
  deleteTodo: (id) => api.delete(`/todos/${id}`),
  getCounts: () => api.get('/todos/statistics/counts')
};

export default api;
