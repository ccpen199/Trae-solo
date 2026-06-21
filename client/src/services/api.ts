import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '@/types';

const BASE_URL = '/api';

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    const res: ApiResponse<any> = response.data;
    if (res.code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(res);
    }
    if (res.code === 403) {
      message.error(res.message || '权限不足');
      return Promise.reject(res);
    }
    if (res.code !== 200 && res.code !== 206) {
      message.error(res.message || '请求失败');
      return Promise.reject(res);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 429) {
      message.error(error.response.data?.message || '请求过于频繁，请稍后再试');
    } else if (!axios.isCancel(error)) {
      message.error(error.message || '网络请求失败');
    }
    return Promise.reject(error);
  }
);

export default request;

export function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  return request(config).then((res) => res.data.data as T);
}

export const userApi = {
  login: (data: { username: string; password: string; imei?: string }) =>
    requestData<{ token: string; user: any; riskLevel: string }>({
      url: '/users/login',
      method: 'POST',
      data,
    }),
  register: (data: any) =>
    requestData<any>({ url: '/users/register', method: 'POST', data }),
  logout: () =>
    requestData<any>({ url: '/users/logout', method: 'POST' }),
  getCurrentUser: () =>
    requestData<any>({ url: '/users/me' }),
  updateProfile: (data: any) =>
    requestData<any>({ url: '/users/me', method: 'PUT', data }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    requestData<any>({ url: '/users/password', method: 'PUT', data }),
  createSubAccount: (data: any) =>
    requestData<any>({ url: '/users/sub-accounts', method: 'POST', data }),
  listSubAccounts: (params?: any) =>
    requestData<any>({ url: '/users/sub-accounts', params }),
  updateSubAccount: (id: number, data: any) =>
    requestData<any>({ url: `/users/sub-accounts/${id}`, method: 'PUT', data }),
  deleteSubAccount: (id: number) =>
    requestData<any>({ url: `/users/sub-accounts/${id}`, method: 'DELETE' }),
  listLoginLogs: (params?: any) =>
    requestData<any>({ url: '/users/login-logs', params }),
  listTrustedDevices: () =>
    requestData<any>({ url: '/users/trusted-devices' }),
  verifyTrustedDevice: (data: { deviceId: number; isTrusted: boolean }) =>
    requestData<any>({ url: '/users/trusted-devices/verify', method: 'PUT', data }),
};

export const deviceApi = {
  listGroups: () =>
    requestData<any[]>({ url: '/devices/groups' }),
  createGroup: (data: any) =>
    requestData<any>({ url: '/devices/groups', method: 'POST', data }),
  updateGroup: (id: number, data: any) =>
    requestData<any>({ url: `/devices/groups/${id}`, method: 'PUT', data }),
  deleteGroup: (id: number) =>
    requestData<any>({ url: `/devices/groups/${id}`, method: 'DELETE' }),
  listDevices: (params?: any) =>
    requestData<any>({ url: '/devices', params }),
  getDevice: (id: number) =>
    requestData<any>({ url: `/devices/${id}` }),
  createDevice: (data: any) =>
    requestData<any>({ url: '/devices', method: 'POST', data }),
  updateDevice: (id: number, data: any) =>
    requestData<any>({ url: `/devices/${id}`, method: 'PUT', data }),
  deleteDevice: (id: number) =>
    requestData<any>({ url: `/devices/${id}`, method: 'DELETE' }),
  controlPTZ: (id: number, data: { command: string; speed?: number }) =>
    requestData<any>({ url: `/devices/${id}/ptz`, method: 'POST', data }),
  shareDevice: (id: number, data: any) =>
    requestData<any>({ url: `/devices/${id}/share`, method: 'POST', data }),
  listOutgoingShares: () =>
    requestData<any>({ url: '/devices/shares/outgoing' }),
  listIncomingShares: () =>
    requestData<any>({ url: '/devices/shares/incoming' }),
  revokeShare: (id: number) =>
    requestData<any>({ url: `/devices/shares/${id}/revoke`, method: 'PUT' }),
  heartbeat: (data: any) =>
    requestData<any>({ url: '/devices/heartbeat', method: 'POST', data }),
};

export const streamApi = {
  getStreamInfo: (deviceId: number) =>
    requestData<any>({ url: `/stream/devices/${deviceId}/stream-info` }),
  getTemporaryStream: (tempToken: string) =>
    requestData<any>({ url: '/stream/temporary-stream', params: { temp_token: tempToken } }),
  startRecording: (deviceId: number, data: { duration?: number; recordType?: string }) =>
    requestData<any>({ url: `/stream/devices/${deviceId}/record`, method: 'POST', data }),
  stopRecording: (data: { recordingId: number }) =>
    requestData<any>({ url: '/stream/record/stop', method: 'POST', data }),
  listRecordings: (params?: any) =>
    requestData<any>({ url: '/stream/recordings', params }),
  getRecordingPlaybackUrl: (id: number) =>
    `${BASE_URL}/stream/recordings/${id}/playback`,
  deleteRecording: (id: number) =>
    requestData<any>({ url: `/stream/recordings/${id}`, method: 'DELETE' }),
  createStoragePolicy: (data: any) =>
    requestData<any>({ url: '/stream/storage-policies', method: 'POST', data }),
  updateStoragePolicy: (id: number, data: any) =>
    requestData<any>({ url: `/stream/storage-policies/${id}`, method: 'PUT', data }),
  listStoragePolicies: () =>
    requestData<any[]>({ url: '/stream/storage-policies' }),
  deleteStoragePolicy: (id: number) =>
    requestData<any>({ url: `/stream/storage-policies/${id}`, method: 'DELETE' }),
  reportAIEvent: (data: any) =>
    requestData<any>({ url: '/stream/ai-event/report', method: 'POST', data }),
  listEvents: (params?: any) =>
    requestData<any>({ url: '/stream/events', params }),
  listAlerts: (params?: any) =>
    requestData<any>({ url: '/stream/alerts', params }),
  markAlertsRead: (data: { ids?: number[] }) =>
    requestData<any>({ url: '/stream/alerts/read', method: 'PUT', data }),
  createAuditLog: (data: { alertId?: number; action: string; detail?: string }) =>
    requestData<any>({ url: '/stream/alert-audit', method: 'POST', data }),
  listAuditLogs: (params?: any) =>
    requestData<any>({ url: '/stream/alert-audit', params }),
  getStatistics: () =>
    requestData<any>({ url: '/stream/statistics' }),
};
