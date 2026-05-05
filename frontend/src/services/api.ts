import axios from 'axios';
import type {
  User,
  Employee,
  Department,
  Attendance,
  Salary,
  Training,
  Transfer,
  RewardPunishment,
  PaginatedResponse,
  LoginResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
  login: (username: string, password: string): Promise<LoginResponse> =>
    api.post('/auth/login', { username, password }).then((res) => res.data),
  
  getCurrentUser: (): Promise<User> =>
    api.get('/auth/me').then((res) => res.data),
  
  initAdmin: (username: string, password: string) =>
    api.post('/auth/init-admin', { username, password }),
};

export const employeeApi = {
  getList: (params?: {
    employeeNo?: string;
    name?: string;
    departmentId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Employee>> =>
    api.get('/employees', { params }).then((res) => res.data),
  
  getById: (id: string): Promise<Employee> =>
    api.get(`/employees/${id}`).then((res) => res.data),
  
  create: (data: Partial<Employee>): Promise<Employee> =>
    api.post('/employees', data).then((res) => res.data),
  
  update: (id: string, data: Partial<Employee>): Promise<Employee> =>
    api.put(`/employees/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/employees/${id}`),
  
  getStats: () =>
    api.get('/employees/stats').then((res) => res.data),
};

export const departmentApi = {
  getList: (): Promise<Department[]> =>
    api.get('/departments').then((res) => res.data),
  
  getTree: (): Promise<Department[]> =>
    api.get('/departments/tree').then((res) => res.data),
  
  getById: (id: string): Promise<Department> =>
    api.get(`/departments/${id}`).then((res) => res.data),
  
  create: (data: Partial<Department>): Promise<Department> =>
    api.post('/departments', data).then((res) => res.data),
  
  update: (id: string, data: Partial<Department>): Promise<Department> =>
    api.put(`/departments/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/departments/${id}`),
};

export const attendanceApi = {
  getList: (params?: {
    employeeId?: string;
    year?: number;
    month?: number;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Attendance>> =>
    api.get('/attendances', { params }).then((res) => res.data),
  
  getById: (id: string): Promise<Attendance> =>
    api.get(`/attendances/${id}`).then((res) => res.data),
  
  getByMonth: (employeeId: string, year: number, month: number): Promise<Attendance> =>
    api.get(`/attendances/employee/${employeeId}/${year}/${month}`).then((res) => res.data),
  
  create: (data: Partial<Attendance>): Promise<Attendance> =>
    api.post('/attendances', data).then((res) => res.data),
  
  update: (id: string, data: Partial<Attendance>): Promise<Attendance> =>
    api.put(`/attendances/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/attendances/${id}`),
  
  batchCreate: (year: number, month: number) =>
    api.post('/attendances/batch', { year, month }),
};

export const salaryApi = {
  getList: (params?: {
    employeeId?: string;
    year?: number;
    month?: number;
    departmentId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Salary>> =>
    api.get('/salaries', { params }).then((res) => res.data),
  
  getById: (id: string): Promise<Salary> =>
    api.get(`/salaries/${id}`).then((res) => res.data),
  
  create: (data: Partial<Salary>): Promise<Salary> =>
    api.post('/salaries', data).then((res) => res.data),
  
  update: (id: string, data: Partial<Salary>): Promise<Salary> =>
    api.put(`/salaries/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/salaries/${id}`),
  
  batchCalculate: (year: number, month: number) =>
    api.post('/salaries/batch', { year, month }),
  
  getReport: (params: { year: number; month: number; departmentId?: string }) =>
    api.get('/salaries/report', { params }).then((res) => res.data),
};

export const trainingApi = {
  getList: (params?: {
    employeeId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Training>> =>
    api.get('/trainings', { params }).then((res) => res.data),
  
  getById: (id: string): Promise<Training> =>
    api.get(`/trainings/${id}`).then((res) => res.data),
  
  create: (data: Partial<Training>): Promise<Training> =>
    api.post('/trainings', data).then((res) => res.data),
  
  update: (id: string, data: Partial<Training>): Promise<Training> =>
    api.put(`/trainings/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/trainings/${id}`),
};

export const transferApi = {
  getList: (params?: {
    employeeId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Transfer>> =>
    api.get('/transfers', { params }).then((res) => res.data),
  
  getById: (id: string): Promise<Transfer> =>
    api.get(`/transfers/${id}`).then((res) => res.data),
  
  create: (data: Partial<Transfer>): Promise<Transfer> =>
    api.post('/transfers', data).then((res) => res.data),
  
  update: (id: string, data: Partial<Transfer>): Promise<Transfer> =>
    api.put(`/transfers/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/transfers/${id}`),
};

export const rewardPunishmentApi = {
  getList: (params?: {
    employeeId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<RewardPunishment>> =>
    api.get('/reward-punishments', { params }).then((res) => res.data),
  
  getById: (id: string): Promise<RewardPunishment> =>
    api.get(`/reward-punishments/${id}`).then((res) => res.data),
  
  create: (data: Partial<RewardPunishment>): Promise<RewardPunishment> =>
    api.post('/reward-punishments', data).then((res) => res.data),
  
  update: (id: string, data: Partial<RewardPunishment>): Promise<RewardPunishment> =>
    api.put(`/reward-punishments/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/reward-punishments/${id}`),
};

export const userApi = {
  getList: (params?: {
    username?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<User>> =>
    api.get('/users', { params }).then((res) => res.data),
  
  getById: (id: string): Promise<User> =>
    api.get(`/users/${id}`).then((res) => res.data),
  
  create: (data: {
    username: string;
    password: string;
    role?: 'ADMIN' | 'USER';
    employeeId?: string;
  }): Promise<User> =>
    api.post('/users', data).then((res) => res.data),
  
  update: (id: string, data: Partial<User> & { password?: string }): Promise<User> =>
    api.put(`/users/${id}`, data).then((res) => res.data),
  
  delete: (id: string) =>
    api.delete(`/users/${id}`),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/users/change-password', { oldPassword, newPassword }),
};

export default api;
