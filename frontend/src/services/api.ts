import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, User, LoginResponse, Project, Bug, Module } from '@/types';

const API_BASE_URL = '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
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
  login: async (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (username: string, password: string, fullName: string, email?: string): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/register', { username, password, fullName, email });
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },

  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    role?: string;
    search?: string;
  }): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/auth/users', { params });
    return response.data;
  },

  createUser: async (data: {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    role?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put(`/auth/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
  },

  adminChangePassword: async (userId: string, data: {
    oldPassword?: string;
    newPassword: string;
    confirmPassword?: string;
  }): Promise<ApiResponse<null>> => {
    const response = await api.post(`/auth/users/${userId}/change-password`, data);
    return response.data;
  },
};

export const userApi = {
  ...authApi,
};

export const projectApi = {
  getProjects: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Project[]>> => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getProjectById: async (id: string): Promise<ApiResponse<Project>> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  getProjectTree: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/projects/${id}/tree`);
    return response.data;
  },

  createProject: async (data: {
    name: string;
    code: string;
    description?: string;
  }): Promise<ApiResponse<Project>> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<ApiResponse<Project>> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  reorderProjects: async (projectIds: string[]): Promise<ApiResponse<Project[]>> => {
    const response = await api.post('/projects/reorder', { projectIds });
    return response.data;
  },
};

export const moduleApi = {
  getModules: async (projectId: string, params?: {
    parentId?: string;
    includeChildren?: boolean;
  }): Promise<ApiResponse<Module[]>> => {
    const response = await api.get(`/modules/project/${projectId}`, { params });
    return response.data;
  },

  getModuleTree: async (projectId: string): Promise<ApiResponse<Module[]>> => {
    const response = await api.get(`/modules/project/${projectId}/tree`);
    return response.data;
  },

  getModuleById: async (id: string): Promise<ApiResponse<Module>> => {
    const response = await api.get(`/modules/${id}`);
    return response.data;
  },

  createModule: async (data: {
    projectId: string;
    name: string;
    code?: string;
    description?: string;
    parentId?: string;
  }): Promise<ApiResponse<Module>> => {
    const response = await api.post('/modules', data);
    return response.data;
  },

  updateModule: async (id: string, data: Partial<Module>): Promise<ApiResponse<Module>> => {
    const response = await api.put(`/modules/${id}`, data);
    return response.data;
  },

  deleteModule: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/modules/${id}`);
    return response.data;
  },

  moveModule: async (id: string, data: {
    newParentId?: string;
    newProjectId?: string;
  }): Promise<ApiResponse<Module>> => {
    const response = await api.post(`/modules/${id}/move`, data);
    return response.data;
  },
};

export const bugApi = {
  getBugs: async (params?: {
    page?: number;
    pageSize?: number;
    projectId?: string;
    moduleId?: string;
    status?: string;
    severity?: string;
    priority?: string;
    assigneeId?: string;
    reporterId?: string;
    isPublished?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<ApiResponse<Bug[]>> => {
    const response = await api.get('/bugs', { params });
    return response.data;
  },

  getBugById: async (id: string): Promise<ApiResponse<Bug>> => {
    const response = await api.get(`/bugs/${id}`);
    return response.data;
  },

  getBugHistory: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/bugs/${id}/history`);
    return response.data;
  },

  getAllowedTransitions: async (status: string): Promise<ApiResponse<{ status: string; transitions: string[] }>> => {
    const response = await api.get(`/bugs/transitions/${status}`);
    return response.data;
  },

  createBug: async (data: {
    projectId: string;
    title: string;
    description: string;
    moduleId?: string;
    requirementId?: string;
    versionId?: string;
    assigneeId?: string;
    severity?: string;
    priority?: string;
    stepsToReproduce?: string;
    expectedResult?: string;
    actualResult?: string;
    environment?: string;
    attachments?: string;
  }): Promise<ApiResponse<Bug>> => {
    const response = await api.post('/bugs', data);
    return response.data;
  },

  updateBug: async (id: string, data: Partial<Bug>): Promise<ApiResponse<Bug>> => {
    const response = await api.put(`/bugs/${id}`, data);
    return response.data;
  },

  updateBugStatus: async (id: string, data: {
    status: string;
    comment?: string;
  }): Promise<ApiResponse<Bug>> => {
    const response = await api.put(`/bugs/${id}/status`, data);
    return response.data;
  },

  publishBugs: async (bugIds: string[]): Promise<ApiResponse<Bug[]>> => {
    const response = await api.post('/bugs/publish', { bugIds });
    return response.data;
  },

  assignBug: async (id: string, assigneeId: string): Promise<ApiResponse<Bug>> => {
    const response = await api.post(`/bugs/${id}/assign`, { assigneeId });
    return response.data;
  },

  deleteBug: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/bugs/${id}`);
    return response.data;
  },
};

export default api;
