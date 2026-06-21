export interface User {
  id: number;
  username: string;
  nickname: string;
  role: 'owner' | 'member' | 'guest';
  phone?: string;
  email?: string;
  avatar?: string;
  status: number;
  parent_id?: number;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  riskLevel: string;
}

export interface DeviceGroup {
  id: number | null;
  name: string;
  device_count: number;
  sort_order: number;
  description?: string;
}

export interface Device {
  id: number;
  device_sn: string;
  name: string;
  model?: string;
  firmware_version?: string;
  protocol: string;
  stream_url?: string;
  rtsp_url?: string;
  rtmp_url?: string;
  video_codec: string;
  audio_codec: string;
  resolution?: string;
  owner_id: number;
  group_id?: number | null;
  group_name?: string;
  imei?: string;
  status: number;
  online_status: number;
  last_online_at?: string;
  last_heartbeat_at?: string;
  ip_address?: string;
  mac_address?: string;
  support_ptz: number;
  support_audio: number;
  created_at: string;
  updated_at: string;
  my_permission: 'owner' | 'view' | 'talk' | 'config';
}

export interface DeviceShare {
  id: number;
  device_id: number;
  device_name: string;
  device_sn: string;
  share_from_user_id: number;
  share_to_user_id?: number;
  share_to_phone?: string;
  to_username?: string;
  to_nickname?: string;
  from_username?: string;
  from_nickname?: string;
  permission_level: 'view' | 'talk' | 'config';
  expire_at?: string;
  temporary_token?: string;
  temporary_token_expire?: string;
  status: number;
  created_at: string;
  shareLink?: string;
}

export interface AIEvent {
  id: number;
  device_id: number;
  device_name: string;
  device_sn: string;
  event_type: string;
  event_level: 'low' | 'normal' | 'high' | 'critical';
  confidence: number;
  snapshot_path?: string;
  video_path?: string;
  location_x?: number;
  location_y?: number;
  location_w?: number;
  location_h?: number;
  description?: string;
  processed: number;
  smart_tags?: string;
  created_at: string;
}

export interface Alert {
  id: number;
  event_id?: number;
  device_id: number;
  device_name: string;
  user_id: number;
  alert_type: string;
  title: string;
  content?: string;
  channels?: string;
  sent_channels?: string;
  status: number;
  read_status: number;
  snapshot_path?: string;
  event_level?: string;
  confidence?: number;
  created_at: string;
}

export interface Recording {
  id: number;
  device_id: number;
  device_name: string;
  device_sn: string;
  file_path: string;
  file_name: string;
  file_size: number;
  fileSizeFormatted: string;
  duration: number;
  start_time: string;
  end_time?: string;
  record_type: 'manual' | 'schedule' | 'event' | 'smart';
  event_id?: number;
  smart_tags?: string;
  encrypted: number;
  status: number;
  created_at: string;
}

export interface StoragePolicy {
  id: number;
  name: string;
  owner_id: number;
  device_id?: number;
  device_name?: string;
  group_id?: number;
  group_name?: string;
  policy_type: 'event' | 'schedule' | 'smart';
  retention_days: number;
  schedule_config?: any;
  smart_tags?: any;
  status: number;
  created_at: string;
}

export interface LoginLog {
  id: number;
  username: string;
  ip: string;
  location?: string;
  status: number;
  risk_level: string;
  fail_reason?: string;
  created_at: string;
}

export interface StreamSession {
  sessionId: string;
  wsUrl: string;
  wsSecureUrl: string;
  permission: string;
  device: {
    id: number;
    name: string;
    videoCodec: string;
    audioCodec: string;
    resolution?: string;
    protocol: string;
    streamUrl?: string;
    rtspUrl?: string;
    supportPTZ: number;
    supportAudio: number;
  };
}

export interface Statistics {
  deviceCount: number;
  onlineCount: number;
  offlineCount: number;
  onlineRate: number;
  todayEventCount: number;
  eventTypeStats: Array<{ event_type: string; count: number }>;
  alertLevelStats: { low: number; normal: number; high: number; critical: number };
  recordingCount: { count: number; total_size: number };
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
