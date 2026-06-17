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

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joinTime: string;
}

export interface AlertEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  type: 'motion' | 'sound' | 'occlusion' | 'person' | 'low_storage';
  level: 'info' | 'warning' | 'critical';
  timestamp: string;
  thumbnail?: string;
  videoUrl?: string;
  read: boolean;
  locked: boolean;
  description: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: 'person_detect' | 'motion' | 'schedule' | 'manual';
    deviceIds: string[];
    condition?: any;
  };
  actions: SceneAction[];
}

export interface SceneAction {
  type: 'record' | 'push_notification' | 'light_on' | 'siren' | 'privacy_mode';
  params: any;
}

export interface StoragePlan {
  type: 'cloud_7d' | 'cloud_30d' | 'sd_card';
  name: string;
  description: string;
  price: number;
  cycleDays: number;
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
  firmwareId: string;
  version: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  totalDevices: number;
  successDevices: number;
  failedDevices: number;
  startTime: string;
  endTime?: string;
  strategy: 'all' | 'region' | 'model' | 'manual';
  regions: string[];
  models: string[];
  grayPercentage?: number;
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

export interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  onlineRate: number;
  offlineCount: number;
  lastOfflineTime?: string;
  recordingIntegrity: number;
  storageWarning: boolean;
  firmwareOutdated: boolean;
  overallScore: number;
}

export interface ApiResponse<T = any> {
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
