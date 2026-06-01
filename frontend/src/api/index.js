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
    if (error.response?.status === 401 && 
        !error.config.url.includes('/auth/login') && 
        window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me')
};

export const assignmentAPI = {
  getAll: () => api.get('/assignments'),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`)
};

export const submissionAPI = {
  getAll: () => api.get('/submissions'),
  getByAssignment: (assignmentId) => api.get(`/submissions/assignment/${assignmentId}`),
  getById: (id) => api.get(`/submissions/${id}`),
  getContent: (id) => api.get(`/submissions/${id}/content`),
  submit: (formData) => api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  runCheck: (id) => api.post(`/submissions/${id}/run-check`)
};

export const appealAPI = {
  getAll: () => api.get('/appeals'),
  getById: (id) => api.get(`/appeals/${id}`),
  create: (data) => api.post('/appeals', data),
  review: (id, data) => api.put(`/appeals/${id}/review`, data),
  markCitation: (resultId, isValidCitation) => 
    api.post(`/appeals/plagiarism/${resultId}/mark-citation`, { isValidCitation })
};

export default api;
