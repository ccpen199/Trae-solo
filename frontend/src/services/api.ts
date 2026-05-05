import axios from 'axios';
import { DailyLog, LoginResponse, User, Evaluation, MissingLogRecord, ProjectFeedback, DailyLogListParams } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (userData: { username: string; password: string; name: string; email?: string; phone?: string }): Promise<{ message: string; user: User }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  }
};

export const dailyLogApi = {
  getDailyLogs: async (params?: DailyLogListParams) => {
    const response = await api.get('/daily-logs', { params });
    return response.data;
  },

  getDailyLogById: async (id: number): Promise<DailyLog> => {
    const response = await api.get(`/daily-logs/${id}`);
    return response.data;
  },

  createDailyLog: async (logData: Partial<DailyLog>): Promise<{ message: string; dailyLog: DailyLog }> => {
    const response = await api.post('/daily-logs', logData);
    return response.data;
  },

  updateDailyLog: async (id: number, logData: Partial<DailyLog>): Promise<{ message: string; dailyLog: DailyLog }> => {
    const response = await api.put(`/daily-logs/${id}`, logData);
    return response.data;
  },

  deleteDailyLog: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/daily-logs/${id}`);
    return response.data;
  },

  submitDailyLog: async (id: number): Promise<{ message: string; dailyLog: DailyLog }> => {
    const response = await api.post(`/daily-logs/${id}/submit`);
    return response.data;
  },

  getDailyLogsByDateRange: async (type: 'day' | 'week' | 'month', date?: string) => {
    const response = await api.get(`/daily-logs/range/${type}`, { params: { date } });
    return response.data;
  }
};

export const managerApi = {
  getDepartmentLogs: async (params?: {
    departmentId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/manager/logs', { params });
    return response.data;
  },

  evaluateDailyLog: async (logId: number, data: { score?: number; comment?: string }): Promise<{ message: string; evaluation: Evaluation }> => {
    const response = await api.post(`/manager/logs/${logId}/evaluate`, data);
    return response.data;
  },

  getProjectFeedbacks: async (params?: {
    projectId?: number;
    startDate?: string;
    endDate?: string;
    isReported?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/manager/project-feedbacks', { params });
    return response.data;
  },

  reportToGM: async (feedbackId: number): Promise<{ message: string; feedback: ProjectFeedback }> => {
    const response = await api.post(`/manager/project-feedbacks/${feedbackId}/report`);
    return response.data;
  },

  getMissingLogs: async (params?: {
    date?: string;
    departmentId?: number;
    logType?: string;
    isNotified?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/manager/missing-logs', { params });
    return response.data;
  }
};

export const adminApi = {
  getUsers: async (params?: {
    departmentId?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    departmentId?: number;
    role?: string;
  }): Promise<{ message: string; user: User }> => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: Partial<User> & { password?: string }): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getDepartments: async (): Promise<any[]> => {
    const response = await api.get('/admin/departments');
    return response.data;
  },

  createDepartment: async (data: { name: string; description?: string; managerId?: number }): Promise<{ message: string; department: any }> => {
    const response = await api.post('/admin/departments', data);
    return response.data;
  },

  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
    departmentId?: number;
    userId?: number;
    projectId?: number;
  }) => {
    const response = await api.get('/admin/statistics', { params });
    return response.data;
  }
};

export default api;
