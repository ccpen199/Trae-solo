export type UserRole = 'admin' | 'viewer' | 'guest';
export type DeviceStatus = 'online' | 'offline' | 'maintenance';
export type DeviceProtocol = 'GB28181' | 'ONVIF';
export type P2PStatus = 'connected' | 'disconnected' | 'relay' | 'negotiating';
export type OrgType = 'enterprise' | 'store' | 'warehouse';
export type AlertType = 'motion' | 'crossing' | 'occlusion' | 'offline' | 'storage_low';
export type AlertLevel = 'critical' | 'warning' | 'info';
export type AlertStatus = 'pending' | 'acknowledged' | 'ignored' | 'escalated';
export type StorageType = 'cloud' | 'edge';
export type AccessLevel = 'view_live' | 'view_playback' | 'control_ptz' | 'full';
export type FirmwareTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  type: OrgType;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  children?: Organization[];
}

export interface Device {
  id: number;
  device_id: string;
  name: string;
  protocol: DeviceProtocol;
  ip: string | null;
  port: number | null;
  status: DeviceStatus;
  p2p_status: P2PStatus;
  org_id: number | null;
  org_name?: string;
  firmware_version: string | null;
  last_heartbeat: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceHealth {
  id: number;
  device_id: number;
  cpu_usage: number;
  temperature: number;
  network_latency: number;
  recorded_at: string;
  device_name?: string;
  status?: DeviceStatus;
}

export interface Alert {
  id: number;
  device_id: number;
  device_name?: string;
  type: AlertType;
  level: AlertLevel;
  message: string | null;
  status: AlertStatus;
  acked_by: number | null;
  acked_at: string | null;
  created_at: string;
}

export interface AlertRule {
  id: number;
  name: string;
  device_id: number | null;
  type: string;
  sensitivity: number;
  schedule: string;
  notification: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: number;
  device_id: number;
  device_name?: string;
  storage_type: StorageType;
  file_path: string;
  start_time: string;
  end_time: string;
  ai_tags: string;
  thumbnail: string | null;
  file_size: number;
  created_at: string;
}

export interface Permission {
  id?: number;
  user_id: number;
  org_id?: number | null;
  device_id?: number | null;
  access_level: AccessLevel;
  created_at?: string;
}

export interface FirmwareTask {
  id: number;
  version: string;
  file_url: string;
  status: FirmwareTaskStatus;
  total_devices: number;
  completed_devices: number;
  failed_devices: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id: number | null;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

export const ALERT_TYPE_MAP: Record<AlertType, string> = {
  motion: '移动侦测',
  crossing: '区域越界',
  occlusion: '画面遮挡',
  offline: '设备离线',
  storage_low: '存储不足',
};

export const ALERT_LEVEL_MAP: Record<AlertLevel, string> = {
  critical: '严重',
  warning: '警告',
  info: '信息',
};

export const ALERT_STATUS_MAP: Record<AlertStatus, string> = {
  pending: '待处理',
  acknowledged: '已确认',
  ignored: '已忽略',
  escalated: '已升级',
};

export const DEVICE_STATUS_MAP: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  maintenance: '维护中',
};

export const P2P_STATUS_MAP: Record<P2PStatus, string> = {
  connected: '已连接',
  disconnected: '未连接',
  relay: '中继转发',
  negotiating: '协商中',
};

export const ORG_TYPE_MAP: Record<OrgType, string> = {
  enterprise: '企业',
  store: '门店',
  warehouse: '仓库',
};

export const ROLE_MAP: Record<UserRole, string> = {
  admin: '管理员',
  viewer: '查看员',
  guest: '访客',
};

export const AI_TAG_MAP: Record<string, string> = {
  person: '人形',
  vehicle: '车辆',
  license_plate: '车牌',
};

export const ACCESS_LEVEL_MAP: Record<AccessLevel, string> = {
  view_live: '实时预览',
  view_playback: '录像回放',
  control_ptz: '云台控制',
  full: '完全控制',
};

export const STORAGE_TYPE_MAP: Record<StorageType, string> = {
  cloud: '云端存储',
  edge: '边缘存储',
};

export const FIRMWARE_STATUS_MAP: Record<FirmwareTaskStatus, string> = {
  pending: '等待中',
  running: '进行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
};
