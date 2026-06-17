import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type {
  Device,
  DeviceGroup,
  FamilyMember,
  AlertEvent,
  Scene,
  StoragePlan,
  ApiResponse,
  PageResult,
} from '@/types';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message: msg, data } = response.data;
    if (code === 0) {
      return data;
    }
    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else {
      message.error(error.response?.data?.message || error.message || '网络错误');
    }
    return Promise.reject(error);
  }
) as any;

export const devicesApi = {
  getDeviceList: (params?: { page?: number; pageSize?: number; groupId?: string; status?: string }) =>
    request.get<any, PageResult<Device>>('/devices', { params }),

  getDevice: (id: string) =>
    request.get<any, Device>(`/devices/${id}`),

  createDevice: (data: Partial<Device>) =>
    request.post<any, Device>('/devices', data),

  updateDevice: (id: string, data: Partial<Device>) =>
    request.put<any, Device>(`/devices/${id}`, data),

  deleteDevice: (id: string) =>
    request.delete(`/devices/${id}`),

  rebootDevice: (id: string) =>
    request.post(`/devices/${id}/reboot`),

  upgradeDevice: (id: string, firmwareId: string) =>
    request.post(`/devices/${id}/upgrade`, { firmwareId }),

  getDeviceGroups: () =>
    request.get<any, DeviceGroup[]>('/device-groups'),

  getDeviceHealth: (id: string) =>
    request.get(`/devices/${id}/health`),
};

export const alertsApi = {
  getAlertList: (params?: { page?: number; pageSize?: number; level?: string; read?: boolean; type?: string }) =>
    request.get<any, PageResult<AlertEvent>>('/alerts', { params }),

  getAlert: (id: string) =>
    request.get<any, AlertEvent>(`/alerts/${id}`),

  markAsRead: (id: string) =>
    request.put(`/alerts/${id}/read`),

  markAllAsRead: () =>
    request.put('/alerts/read-all'),

  getUnreadCount: () =>
    request.get<any, { count: number }>('/alerts/unread-count'),

  lockAlert: (id: string) =>
    request.put(`/alerts/${id}/lock`),

  unlockAlert: (id: string) =>
    request.put(`/alerts/${id}/unlock`),
};

export const scenesApi = {
  getSceneList: () =>
    request.get<any, Scene[]>('/scenes'),

  getScene: (id: string) =>
    request.get<any, Scene>(`/scenes/${id}`),

  createScene: (data: Partial<Scene>) =>
    request.post<any, Scene>('/scenes', data),

  updateScene: (id: string, data: Partial<Scene>) =>
    request.put<any, Scene>(`/scenes/${id}`, data),

  deleteScene: (id: string) =>
    request.delete(`/scenes/${id}`),

  enableScene: (id: string) =>
    request.put(`/scenes/${id}/enable`),

  disableScene: (id: string) =>
    request.put(`/scenes/${id}/disable`),

  triggerScene: (id: string) =>
    request.post(`/scenes/${id}/trigger`),
};

export const usersApi = {
  getFamilyMembers: () =>
    request.get<any, FamilyMember[]>('/family-members'),

  addFamilyMember: (data: { name: string; role: string; email?: string; phone?: string }) =>
    request.post<any, FamilyMember>('/family-members', data),

  removeFamilyMember: (id: string) =>
    request.delete(`/family-members/${id}`),

  updateMemberRole: (id: string, role: string) =>
    request.put(`/family-members/${id}/role`, { role }),

  getCurrentUser: () =>
    request.get('/users/current'),

  updateProfile: (data: { name?: string; avatar?: string }) =>
    request.put('/users/profile', data),
};

export const storageApi = {
  getStoragePlans: () =>
    request.get<any, StoragePlan[]>('/storage/plans'),

  subscribePlan: (planType: string) =>
    request.post('/storage/subscribe', { planType }),

  unsubscribePlan: (planType: string) =>
    request.post('/storage/unsubscribe', { planType }),

  getStorageUsage: () =>
    request.get('/storage/usage'),

  getStorageRecords: (params?: { page?: number; pageSize?: number; deviceId?: string; startTime?: string; endTime?: string }) =>
    request.get('/storage/records', { params }),
};

export default request;
