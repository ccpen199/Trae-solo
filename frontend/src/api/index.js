import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:58829/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
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
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me')
};

export const examAPI = {
  getExams: () => api.get('/exams'),
  getExam: (id) => api.get(`/exams/${id}`),
  createExam: (data) => api.post('/exams', data),
  updateExam: (id, data) => api.put(`/exams/${id}`, data),
  publishExam: (id) => api.post(`/exams/${id}/publish`),
  assignStudents: (id, studentIds) => api.post(`/exams/${id}/assign-students`, { student_ids: studentIds }),
  getExamStudents: (id) => api.get(`/exams/${id}/students`)
};

export const studentAPI = {
  verifyIdentity: (examId, data) => api.post(`/student/verify-identity/${examId}`, data),
  checkDevice: (examId, data) => api.post(`/student/check-device/${examId}`, data),
  acceptPromise: (examId) => api.post(`/student/accept-promise/${examId}`),
  enterExam: (examId) => api.post(`/student/enter-exam/${examId}`),
  submitAnswer: (examStudentId, data) => api.post(`/student/submit-answer/${examStudentId}`, data),
  submitExam: (examStudentId) => api.post(`/student/submit-exam/${examStudentId}`)
};

export const anomalyAPI = {
  reportAnomaly: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return api.post('/anomalies/report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getAnomalies: (params) => api.get('/anomalies', { params }),
  getStudentAnomalies: (examStudentId) => api.get(`/anomalies/student/${examStudentId}`),
  handleAnomaly: (id, handleNote) => api.put(`/anomalies/${id}/handle`, { handle_note: handleNote }),
  getStats: (examId) => api.get(`/anomalies/stats/${examId}`)
};

export const userAPI = {
  getUsers: (role) => api.get('/users', { params: { role } }),
  getStudents: () => api.get('/users/students'),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export default api;
