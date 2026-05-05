import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Task,
  Plan,
  Feedback,
  LoginResponse,
  ApiResponse,
  PaginationParams,
  PaginationData,
} from '@/types';

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
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

// 响应拦截器 - 处理 token 过期
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/me');
    return response.data;
  },
};

// 用户 API
export const userApi = {
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response: AxiosResponse<ApiResponse<User[]>> = await api.get('/users');
    return response.data;
  },

  getEmployees: async (): Promise<ApiResponse<User[]>> => {
    const response: AxiosResponse<ApiResponse<User[]>> = await api.get('/users/employees');
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (
    id: string,
    userData: Partial<{
      email: string;
      name: string;
      role: string;
      isActive: boolean;
      password: string;
    }>
  ): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// 任务 API
export const taskApi = {
  getSupervisorTasks: async (params?: PaginationParams): Promise<ApiResponse<PaginationData<Task>>> => {
    const response: AxiosResponse<ApiResponse<PaginationData<Task>>> = await api.get('/tasks/supervisor', {
      params,
    });
    return response.data;
  },

  getEmployeeTasks: async (params?: PaginationParams): Promise<ApiResponse<PaginationData<Task>>> => {
    const response: AxiosResponse<ApiResponse<PaginationData<Task>>> = await api.get('/tasks/employee', {
      params,
    });
    return response.data;
  },

  getTaskById: async (id: string): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    assigneeId: string;
  }): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (
    id: string,
    taskData: Partial<{
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      assigneeId: string;
    }>
  ): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  startTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.post(`/tasks/${id}/start`);
    return response.data;
  },

  confirmTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.post(`/tasks/${id}/confirm`);
    return response.data;
  },
};

// 计划 API
export const planApi = {
  getPlansByTask: async (taskId: string): Promise<ApiResponse<Plan[]>> => {
    const response: AxiosResponse<ApiResponse<Plan[]>> = await api.get(`/plans/task/${taskId}`);
    return response.data;
  },

  createPlan: async (planData: {
    taskId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
  }): Promise<ApiResponse<Plan>> => {
    const response: AxiosResponse<ApiResponse<Plan>> = await api.post('/plans', planData);
    return response.data;
  },

  updatePlan: async (
    id: string,
    planData: Partial<{
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      status: string;
    }>
  ): Promise<ApiResponse<Plan>> => {
    const response: AxiosResponse<ApiResponse<Plan>> = await api.put(`/plans/${id}`, planData);
    return response.data;
  },

  deletePlan: async (id: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.delete(`/plans/${id}`);
    return response.data;
  },
};

// 反馈 API
export const feedbackApi = {
  getFeedbacksByTask: async (taskId: string): Promise<ApiResponse<Feedback[]>> => {
    const response: AxiosResponse<ApiResponse<Feedback[]>> = await api.get(`/feedbacks/task/${taskId}`);
    return response.data;
  },

  submitFeedback: async (feedbackData: {
    taskId: string;
    content: string;
  }): Promise<ApiResponse<Feedback>> => {
    const response: AxiosResponse<ApiResponse<Feedback>> = await api.post('/feedbacks', feedbackData);
    return response.data;
  },
};

export default api;
