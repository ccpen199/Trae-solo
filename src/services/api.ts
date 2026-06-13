import type {
  DeviceHealth,
  SignalHistory,
  BatteryTrend,
  AlertEvent,
  AlertStats,
  OtaStatus,
  OtaHistory,
  GeofenceConfig,
  VideoLinkStatus,
  NightVisionLog,
  CallRecord,
  StorageInfo,
  AlertType,
} from '@/types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export const deviceApi = {
  getDevices: () => request<DeviceHealth[]>('/devices'),
  getDevice: (id: string) => request<DeviceHealth>(`/devices/${id}`),
  getSignalHistory: (id: string) => request<SignalHistory[]>(`/devices/${id}/signal/history`),
  getBatteryTrend: (id: string) => request<BatteryTrend[]>(`/devices/${id}/battery/trend`),
};

export const alertApi = {
  getAlerts: (params?: { type?: AlertType; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', String(params.limit));
    return request<AlertEvent[]>(`/alerts?${query.toString()}`);
  },
  getStats: () => request<AlertStats>('/alerts/stats'),
  markRead: (id: string) => request<{ success: boolean }>(`/alerts/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request<{ success: boolean }>('/alerts/read-all', { method: 'PUT' }),
};

export const otaApi = {
  getStatus: () => request<OtaStatus>('/ota/status'),
  getHistory: () => request<OtaHistory[]>('/ota/history'),
  startUpgrade: () => request<{ success: boolean }>('/ota/start', { method: 'POST' }),
  pauseUpgrade: () => request<{ success: boolean; breakpoint: number }>('/ota/pause', { method: 'POST' }),
  resumeUpgrade: () => request<{ success: boolean }>('/ota/resume', { method: 'POST' }),
};

export const geofenceApi = {
  getConfig: () => request<GeofenceConfig>('/geofence'),
  updateConfig: (config: Partial<GeofenceConfig>) =>
    request<GeofenceConfig>('/geofence', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};

export const videoApi = {
  getLinkStatus: () => request<VideoLinkStatus>('/video/link-status'),
};

export const logApi = {
  getNightVisionLogs: () => request<NightVisionLog[]>('/logs/night-vision'),
  getCallRecords: () => request<CallRecord[]>('/logs/calls'),
};

export const privacyApi = {
  getStorageInfo: () => request<StorageInfo>('/privacy/storage'),
  getEncryptionStatus: () => request<{ enabled: boolean; keyId: string }>('/privacy/encryption'),
  updateEncryption: (enabled: boolean) =>
    request<{ success: boolean }>('/privacy/encryption', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    }),
  clearStorage: () => request<{ success: boolean; freed: number }>('/privacy/clear', { method: 'POST' }),
};
