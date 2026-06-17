export interface Device {
  id: string;
  name: string;
  type: 'IPC' | 'NVR' | 'doorbell';
  model: string;
  firmwareVersion: string;
  status: 'online' | 'offline' | 'upgrading';
  groupId: string;
  ipAddress: string;
  macAddress: string;
  storage: {
    total: number;
    used: number;
    sdCard: boolean;
    sdTotal: number;
    sdUsed: number;
  };
  privacy: {
    cameraEnabled: boolean;
    audioEnabled: boolean;
    physicalLock: boolean;
  };
  lastOnline: string;
  location: string;
  signalStrength: number;
}

export interface DeviceGroup {
  id: string;
  name: string;
  deviceIds: string[];
}

export interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  model?: string;
  onlineRate: number;
  offlineCount: number;
  lastOfflineTime?: string;
  recordingIntegrity: number;
  storageWarning: boolean;
  firmwareOutdated: boolean;
  overallScore: number;
  device?: Device;
  dailyStats?: DailyHealthStat[];
}

export interface DailyHealthStat {
  date: string;
  onlineHours: number;
  offlineCount: number;
  recordingHours: number;
}

export interface OfflineLog {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
}

export interface RecordingIntegrityDay {
  date: string;
  hours: { hour: number; hasRecording: boolean }[];
  integrity: number;
}

export interface HealthOverviewData {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  onlineRate: string;
  avgHealthScore: string;
  storageWarnings: number;
  outdatedFirmware: number;
  alertToday: number;
  alertTrend: number[];
  onlineTrend: number[];
}

export interface FirmwareVersion {
  id: string;
  version: string;
  model: string;
  releaseDate: string;
  releaseNotes: string;
  fileSize: number;
  md5: string;
  status: 'testing' | 'gray' | 'full' | 'recalled';
  grayRegions: string[];
  grayPercentage: number;
}

export interface OTATask {
  id: string;
  name?: string;
  firmwareId: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalDevices: number;
  successDevices: number;
  failedDevices: number;
  startTime: string;
  endTime?: string;
  strategy: 'all' | 'region' | 'model' | 'manual';
  regions: string[];
  models: string[];
  grayPercentage: number;
  scheduleTime?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  deviceId?: string;
  deviceName?: string;
  ip: string;
  timestamp: string;
  details: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor';
