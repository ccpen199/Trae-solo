import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
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

axiosInstance.interceptors.response.use(
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

export const api = {
  auth: {
    login: (data: { username: string; password: string }) =>
      axiosInstance.post('/auth/login', data),
    registerWorker: (data: any) =>
      axiosInstance.post('/auth/register/worker', data),
    registerEnterprise: (data: any) =>
      axiosInstance.post('/auth/register/enterprise', data),
    getCurrentUser: () =>
      axiosInstance.get('/auth/me')
  },

  trades: {
    getAll: (params?: { category?: string }) =>
      axiosInstance.get('/trades', { params }),
  },

  certifications: {
    submit: (data: any) =>
      axiosInstance.post('/certifications', data),
    getMy: () =>
      axiosInstance.get('/certifications/my'),
    getAll: (params?: any) =>
      axiosInstance.get('/certifications', { params }),
    getDetail: (id: number) =>
      axiosInstance.get(`/certifications/${id}`),
    verify: (id: number, status: string) =>
      axiosInstance.put(`/certifications/${id}/verify`, { status }),
    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append('certificate', file);
      return axiosInstance.post('/certifications/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  },

  skills: {
    getExamQuestions: (tradeId: number) =>
      axiosInstance.get(`/exam/questions/${tradeId}`),
    submitExam: (data: any) =>
      axiosInstance.post('/exam/submit', data),
    uploadVideo: (file: File) => {
      const formData = new FormData();
      formData.append('video', file);
      return axiosInstance.post('/practical/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    submitPractical: (data: any) =>
      axiosInstance.post('/practical/submit', data),
    getMyAssessments: () =>
      axiosInstance.get('/assessments/my'),
    getAssessmentDetail: (id: number) =>
      axiosInstance.get(`/assessments/${id}`)
  },

  jobs: {
    create: (data: any) =>
      axiosInstance.post('/jobs', data),
    getAll: (params?: any) =>
      axiosInstance.get('/jobs', { params }),
    getMy: () =>
      axiosInstance.get('/jobs/my'),
    getDetail: (id: number) =>
      axiosInstance.get(`/jobs/${id}`),
    update: (id: number, data: any) =>
      axiosInstance.put(`/jobs/${id}`, data)
  },

  projects: {
    create: (data: any) =>
      axiosInstance.post('/projects', data),
    getAll: (params?: any) =>
      axiosInstance.get('/projects', { params }),
    getMy: () =>
      axiosInstance.get('/projects/my'),
    getDetail: (id: number) =>
      axiosInstance.get(`/projects/${id}`),
    update: (id: number, data: any) =>
      axiosInstance.put(`/projects/${id}`, data),
    updateStatus: (id: number, status: string) =>
      axiosInstance.put(`/projects/${id}/status`, { status })
  },

  contracts: {
    create: (data: any) =>
      axiosInstance.post('/contracts', data),
    getMy: (params?: { status?: string }) =>
      axiosInstance.get('/contracts', { params }),
    getDetail: (id: number) =>
      axiosInstance.get(`/contracts/${id}`),
    signWorker: (id: number) =>
      axiosInstance.put(`/contracts/${id}/sign/worker`),
    signEnterprise: (id: number) =>
      axiosInstance.put(`/contracts/${id}/sign/enterprise`)
  },

  attendance: {
    checkIn: (data: any) =>
      axiosInstance.post('/attendance/checkin', data),
    checkOut: (data: any) =>
      axiosInstance.post('/attendance/checkout', data),
    getMy: (params?: any) =>
      axiosInstance.get('/attendance/my', { params }),
    getProject: (params: any) =>
      axiosInstance.get('/attendance/project', { params })
  },

  payrolls: {
    generate: (data: any) =>
      axiosInstance.post('/payrolls/generate', data),
    getMy: (params?: any) =>
      axiosInstance.get('/payrolls/my', { params }),
    getDetail: (id: number) =>
      axiosInstance.get(`/payrolls/${id}`),
    markViewed: (id: number) =>
      axiosInstance.put(`/payrolls/${id}/viewed`),
    updateTransfer: (id: number, data: any) =>
      axiosInstance.put(`/payrolls/${id}/transfer`, data)
  },

  admin: {
    getUsers: (params?: any) =>
      axiosInstance.get('/admin/users', { params }),
    updateUserStatus: (id: number, status: string, data?: any) =>
      axiosInstance.put(`/admin/users/${id}/status`, { status, ...data }),
    verifyEnterprise: (id: number, data: any) =>
      axiosInstance.put(`/admin/enterprises/${id}/verify`, data),
    getStatistics: () =>
      axiosInstance.get('/admin/statistics'),
    getSocialSecurityWarnings: (params?: any) =>
      axiosInstance.get('/admin/social-security/warnings', { params }),
    updateSocialSecurityDisposal: (id: number, data: any) =>
      axiosInstance.put(`/admin/social-security/${id}/disposal`, data),
    deleteBiometric: (data: any) =>
      axiosInstance.post('/admin/biometric/delete', data),
    getBiometricLogs: (params?: any) =>
      axiosInstance.get('/admin/biometric/logs', { params }),
    getAuditLogs: (params?: any) =>
      axiosInstance.get('/admin/audit-logs', { params })
  }
};

export default axiosInstance;
