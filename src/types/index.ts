export interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  online: boolean;
  signalStrength: number;
  storageTotal: number;
  storageUsed: number;
  batteryLevel: number;
  batteryHealth: number;
  firmwareVersion: string;
  lastSeen: string;
}

export interface SignalHistory {
  timestamp: string;
  value: number;
}

export interface BatteryTrend {
  date: string;
  capacity: number;
}

export type AlertType = 'visitor' | 'family' | 'pet' | 'motion';

export interface AlertEvent {
  id: string;
  type: AlertType;
  timestamp: string;
  thumbnail: string;
  confidence: number;
  deviceId: string;
  read: boolean;
  description?: string;
}

export type UpgradeStatus = 'idle' | 'downloading' | 'verifying' | 'installing' | 'rebooting' | 'success' | 'failed';

export interface OtaStatus {
  currentVersion: string;
  latestVersion: string;
  upgradeProgress: number;
  upgradeStatus: UpgradeStatus;
  breakpoint: number | null;
  deltaSize: string;
  fullSize: string;
  releaseNotes: string;
  estimatedTime?: number;
}

export interface OtaHistory {
  id: string;
  version: string;
  timestamp: string;
  status: 'success' | 'failed' | 'rollback';
  duration: number;
  deltaSize: string;
}

export interface GeofenceConfig {
  enabled: boolean;
  homeAddress: string;
  latitude: number;
  longitude: number;
  radius: number;
  enterAction: 'silent' | 'notify' | 'disarm';
  exitAction: 'notify' | 'arm' | 'ignore';
}

export interface VideoLinkStatus {
  p2p: {
    connected: boolean;
    latency: number;
    bitrate: number;
  };
  relay: {
    connected: boolean;
    latency: number;
    bitrate: number;
  };
  activeLink: 'p2p' | 'relay';
  resolution: '1080p' | '720p' | '480p';
  fps: number;
  codec: 'H.265' | 'H.264';
}

export interface NightVisionLog {
  id: string;
  timestamp: string;
  event: 'ir_on' | 'ir_off' | 'exposure_adjust';
  lightLevel: number;
  exposureCompensation: number;
  reason: string;
}

export interface CallRecord {
  id: string;
  startTime: string;
  duration: number;
  direction: 'incoming' | 'outgoing';
  quality: number;
  noiseReduction: boolean;
  echoCancellation: boolean;
}

export interface StorageInfo {
  total: number;
  used: number;
  videoCount: number;
  snapshotCount: number;
  encrypted: boolean;
}

export interface AlertStats {
  today: number;
  week: number;
  byType: Record<AlertType, number>;
  byHour: number[];
}
