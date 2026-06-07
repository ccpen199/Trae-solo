import request from './request';
import {
  LoginRequest,
  LoginResponse,
  User,
  License,
  LicenseUsageRecord,
  ServiceItem,
  Application,
  TimelineEvent,
  QrCodeData,
  ApiResponse,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    request.post<any, ApiResponse<LoginResponse>>('/auth/login', data),
  getMe: () => request.get<any, ApiResponse<User>>('/auth/me'),
  logout: () => request.post<any, ApiResponse>('/auth/logout'),
};

export const serviceApi = {
  search: (params: { keyword?: string; category?: string; page?: number; pageSize?: number }) =>
    request.get<any, ApiResponse<ServiceItem[]>>('/services', { params }),
  getCategories: () => request.get<any, ApiResponse<string[]>>('/services/categories'),
  getById: (id: number) => request.get<any, ApiResponse<ServiceItem>>(`/services/${id}`),
  getScenarioGuide: (id: number) => request.get<any, ApiResponse<any>>(`/services/${id}/scenario`),
  getFormSchema: (id: number) => request.get<any, ApiResponse<any>>(`/services/${id}/form-schema`),
  getMaterials: (id: number) => request.get<any, ApiResponse<any[]>>(`/services/${id}/materials`),
};

export const licenseApi = {
  getMyLicenses: () => request.get<any, ApiResponse<License[]>>('/licenses'),
  getById: (id: number) => request.get<any, ApiResponse<License>>(`/licenses/${id}`),
  generateQrCode: (id: number) =>
    request.post<any, ApiResponse<QrCodeData>>(`/licenses/${id}/qrcode`),
  getUsageRecords: (id: number) =>
    request.get<any, ApiResponse<LicenseUsageRecord[]>>(`/licenses/${id}/usage-records`),
};

export const applicationApi = {
  create: (data: {
    serviceItemId: number;
    serviceItemName: string;
    formData: any;
    materials: any[];
  }) => request.post<any, ApiResponse<Application>>('/applications', data),
  getMyApplications: (params: { status?: string; page?: number; pageSize?: number }) =>
    request.get<any, ApiResponse<Application[]>>('/applications', { params }),
  getStats: () => request.get<any, ApiResponse<any>>('/applications/stats'),
  getById: (id: number) => request.get<any, ApiResponse<Application>>(`/applications/${id}`),
  getTimeline: (id: number) =>
    request.get<any, ApiResponse<TimelineEvent[]>>(`/applications/${id}/timeline`),
  submitSignature: (id: number, data: { signature: string }) =>
    request.post<any, ApiResponse>(`/applications/${id}/signature`, data),
};

export const metricsApi = {
  getOverview: () => request.get<any, ApiResponse<any>>('/metrics/overview'),
  getBottlenecks: () => request.get<any, ApiResponse<any[]>>('/metrics/bottlenecks'),
  getDailyTrend: (params: { days?: number }) =>
    request.get<any, ApiResponse<any[]>>('/metrics/trend', { params }),
  getDepartmentStats: () => request.get<any, ApiResponse<any[]>>('/metrics/department-stats'),
  getApiResources: (params: { keyword?: string; page?: number; pageSize?: number }) =>
    request.get<any, ApiResponse<any[]>>('/metrics/api-resources', { params }),
};
