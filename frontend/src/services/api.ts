import axios from 'axios';
import { ApiResponse, Document, TodoTask, User, DocumentTracking } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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

export const authApi = {
  login: async (username: string, password: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getUsers: async (): Promise<ApiResponse> => {
    const response = await api.get('/auth/users');
    return response.data;
  },
};

export const documentApi = {
  create: async (data: Partial<Document>): Promise<ApiResponse> => {
    const response = await api.post('/documents', data);
    return response.data;
  },

  getMyDocuments: async (params?: {
    status?: string;
    document_type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse> => {
    const response = await api.get('/documents/my', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<Document>): Promise<ApiResponse> => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
  },

  submit: async (id: number, approverIds: number[]): Promise<ApiResponse> => {
    const response = await api.post(`/documents/${id}/submit`, { approver_ids: approverIds });
    return response.data;
  },
};

export const approvalApi = {
  getTodoList: async (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse> => {
    const response = await api.get('/approval/todos', { params });
    return response.data;
  },

  getTodoDetail: async (id: number): Promise<ApiResponse> => {
    const response = await api.get(`/approval/todos/${id}`);
    return response.data;
  },

  handleApproval: async (id: number, action: string, comment?: string): Promise<ApiResponse> => {
    const response = await api.post(`/approval/todos/${id}/handle`, { action, comment });
    return response.data;
  },
};

export const queryApi = {
  search: async (params?: {
    document_type?: string;
    status?: string;
    category?: string;
    keyword?: string;
    exact_match?: boolean;
    document_number?: string;
    title?: string;
    start_date?: string;
    end_date?: string;
    is_archived?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse> => {
    const response = await api.get('/query/search', { params });
    return response.data;
  },

  getTracking: async (id: number): Promise<ApiResponse> => {
    const response = await api.get(`/query/tracking/${id}`);
    return response.data;
  },

  getArchived: async (params?: {
    keyword?: string;
    document_type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse> => {
    const response = await api.get('/query/archived', { params });
    return response.data;
  },

  archive: async (id: number): Promise<ApiResponse> => {
    const response = await api.post(`/query/${id}/archive`);
    return response.data;
  },
};

export default api;
