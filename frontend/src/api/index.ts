import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
}) as any;

axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    let errorMessage = '请求失败，请稍后重试';
    let errorCode = 'unknown';
    
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      errorCode = error.response.status.toString();
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络';
      errorCode = 'network_error';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return Promise.reject({
      error: errorMessage,
      message: errorMessage,
      code: errorCode,
      status: error.response?.status,
      original: error
    });
  }
);

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    axiosInstance.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', data),
  getProfile: () => axiosInstance.get('/auth/profile'),
  updateProfile: (data: { name: string }) =>
    axiosInstance.put('/auth/profile', data)
};

export const resumeApi = {
  list: () => axiosInstance.get('/resumes'),
  get: (id: number) => axiosInstance.get(`/resumes/${id}`),
  create: (data: { title: string; template_id?: string; content?: any }) =>
    axiosInstance.post('/resumes', data),
  update: (id: number, data: any) => axiosInstance.put(`/resumes/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/resumes/${id}`)
};

export const templateApi = {
  list: (industry?: string) =>
    axiosInstance.get('/templates', { params: { industry } }),
  get: (id: string) => axiosInstance.get(`/templates/${id}`)
};

export const importApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/import/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  parseText: (text: string) =>
    axiosInstance.post('/import/text', { text })
};

export const qualityApi = {
  analyze: (content: any, industry?: string) =>
    axiosInstance.post('/quality/analyze', { content, industry }),
  generateATSText: (content: any) =>
    axiosInstance.post('/quality/ats-text', { content })
};

export const exportApi = {
  downloadHTML: (id: number) => window.open(`${API_BASE_URL}/export/${id}/html`, '_blank'),
  downloadDOC: (id: number) => window.open(`${API_BASE_URL}/export/${id}/doc`, '_blank'),
  downloadATS: (id: number) => window.open(`${API_BASE_URL}/export/${id}/ats`, '_blank'),
  preview: (id: number) => window.open(`${API_BASE_URL}/export/${id}/preview`, '_blank'),
  generateAll: (id: number) => axiosInstance.post(`/export/${id}/generate-all`)
};

export const deliveryApi = {
  create: (data: { resume_id: number; company: string; position: string }) =>
    axiosInstance.post('/delivery', data),
  list: () => axiosInstance.get('/delivery'),
  get: (id: number) => axiosInstance.get(`/delivery/${id}`),
  track: (trackingCode: string) => axiosInstance.get(`/delivery/track/${trackingCode}`)
};

export const adminApi = {
  getStats: () => axiosInstance.get('/admin/stats'),
  getUsers: (page?: number, pageSize?: number) =>
    axiosInstance.get('/admin/users', { params: { page, pageSize } }),
  getResumes: (page?: number, pageSize?: number) =>
    axiosInstance.get('/admin/resumes', { params: { page, pageSize } }),
  getDeliveries: (page?: number, pageSize?: number) =>
    axiosInstance.get('/admin/deliveries', { params: { page, pageSize } }),
  deleteUser: (id: number) => axiosInstance.delete(`/admin/users/${id}`),
  getLogs: () => axiosInstance.get('/admin/logs')
};

export default axiosInstance;
