import axios, { type AxiosInstance } from 'axios';
import type {
  DeviceHealth,
  HealthOverviewData,
  OfflineLog,
  RecordingIntegrityDay,
  AuditLog,
  FirmwareVersion,
  OTATask,
  PageResult,
} from '@/types';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 0) {
      return res.data;
    }
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const healthApi = {
  getOverview: (): Promise<HealthOverviewData> => {
    return request.get('/health/overview');
  },

  getDeviceList: (
    params: { page?: number; pageSize?: number; status?: string } = {}
  ): Promise<PageResult<DeviceHealth>> => {
    return request.get('/health/devices', { params });
  },

  getDeviceDetail: (deviceId: string): Promise<DeviceHealth> => {
    return request.get(`/health/devices/${deviceId}`);
  },

  getOfflineLogs: (deviceId: string): Promise<OfflineLog[]> => {
    return request.get(`/health/offline-logs/${deviceId}`);
  },

  getRecordingIntegrity: (deviceId: string): Promise<RecordingIntegrityDay[]> => {
    return request.get(`/health/recording-integrity/${deviceId}`);
  },
};

export const auditApi = {
  getLogs: (
    params: {
      page?: number;
      pageSize?: number;
      userId?: string;
      action?: string;
      deviceId?: string;
      startTime?: string;
      endTime?: string;
    } = {}
  ): Promise<PageResult<AuditLog>> => {
    return request.get('/audit/logs', { params });
  },

  getActions: (): Promise<string[]> => {
    return request.get('/audit/actions');
  },

  exportLogs: (params: {
    startTime?: string;
    endTime?: string;
    action?: string;
  }): Promise<Blob> => {
    return request.get('/audit/export', {
      params,
      responseType: 'blob',
    });
  },
};

export const otaApi = {
  getFirmwares: (
    params: {
      model?: string;
      status?: string;
    } = {}
  ): Promise<FirmwareVersion[]> => {
    return request.get('/ota/firmwares', { params });
  },

  createFirmware: (data: Partial<FirmwareVersion>): Promise<FirmwareVersion> => {
    return request.post('/ota/firmwares', data);
  },

  updateFirmware: (
    id: string,
    data: Partial<FirmwareVersion>
  ): Promise<FirmwareVersion> => {
    return request.put(`/ota/firmwares/${id}`, data);
  },

  getTasks: (
    params: {
      status?: string;
      strategy?: string;
    } = {}
  ): Promise<OTATask[]> => {
    return request.get('/ota/tasks', { params });
  },

  createTask: (data: {
    firmwareId: string;
    strategy: OTATask['strategy'];
    regions?: string[];
    models?: string[];
    grayPercentage?: number;
    scheduleTime?: string;
    name?: string;
  }): Promise<OTATask> => {
    return request.post('/ota/tasks', data);
  },

  startTask: (id: string): Promise<void> => {
    return request.post(`/ota/tasks/${id}/start`);
  },

  stopTask: (id: string): Promise<void> => {
    return request.post(`/ota/tasks/${id}/stop`);
  },

  getModels: (): Promise<string[]> => {
    return request.get('/ota/models');
  },

  getRegions: (): Promise<string[]> => {
    return request.get('/ota/regions');
  },
};

export default request;
