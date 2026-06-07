export type UserRole = 'admin' | 'operation' | 'maintenance' | 'fleet_admin' | 'owner';

export const ROLE_MAP: Record<UserRole, string> = {
  admin: '系统管理员',
  operation: '运营人员',
  maintenance: '运维人员',
  fleet_admin: '车队管理员',
  owner: '车主',
};

export type VehicleType = 'passenger' | 'truck';

export const VEHICLE_TYPE_MAP: Record<VehicleType, string> = {
  passenger: '客车',
  truck: '货车',
};

export type VehicleClass = '1' | '2' | '3' | '4' | '5' | '6';

export const VEHICLE_CLASS_MAP: Record<VehicleClass, string> = {
  '1': '一类车',
  '2': '二类车',
  '3': '三类车',
  '4': '四类车',
  '5': '五类车',
  '6': '六类车',
};

export type ObuStatus = 'inventory' | 'activated' | 'deactivated' | 'scrapped';

export const OBU_STATUS_MAP: Record<ObuStatus, string> = {
  inventory: '库存',
  activated: '已激活',
  deactivated: '已停用',
  scrapped: '已报废',
};

export type AppealStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'closed';

export const APPEAL_STATUS_MAP: Record<AppealStatus, string> = {
  pending: '待处理',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  closed: '已关闭',
};

export type AppealType = 'overcharge' | 'wrong_vehicle' | 'duplicate' | 'other';

export const APPEAL_TYPE_MAP: Record<AppealType, string> = {
  overcharge: '多收费用',
  wrong_vehicle: '车辆不符',
  duplicate: '重复扣费',
  other: '其他',
};

export type UpgradeTaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';

export const UPGRADE_STATUS_MAP: Record<UpgradeTaskStatus, string> = {
  pending: '待执行',
  running: '进行中',
  paused: '已暂停',
  completed: '已完成',
  cancelled: '已取消',
};

export type UpgradeLogStatus = 'pending' | 'downloading' | 'installing' | 'success' | 'failed';

export const UPGRADE_LOG_STATUS_MAP: Record<UpgradeLogStatus, string> = {
  pending: '待升级',
  downloading: '下载中',
  installing: '安装中',
  success: '成功',
  failed: '失败',
};

export type BillStatus = 'unpaid' | 'paid' | 'overdue' | 'waived';

export const BILL_STATUS_MAP: Record<BillStatus, string> = {
  unpaid: '待支付',
  paid: '已支付',
  overdue: '已逾期',
  waived: '已减免',
};

export type AccountStatus = 'normal' | 'frozen' | 'disabled';

export const ACCOUNT_STATUS_MAP: Record<AccountStatus, string> = {
  normal: '正常',
  frozen: '已冻结',
  disabled: '已停用',
};

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'activate'
  | 'deactivate'
  | 'upgrade'
  | 'export';

export const AUDIT_ACTION_MAP: Record<AuditAction, string> = {
  login: '登录',
  logout: '登出',
  create: '创建',
  update: '更新',
  delete: '删除',
  approve: '审批通过',
  reject: '审批拒绝',
  activate: '激活',
  deactivate: '停用',
  upgrade: '升级',
  export: '导出',
};

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  name: string;
  phone: string | null;
  email: string | null;
  fleet_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserResponse extends Omit<User, 'password_hash'> {
  fleet_name?: string;
}

export interface Fleet {
  id: number;
  name: string;
  code: string;
  contact_person: string | null;
  contact_phone: string | null;
  address: string | null;
  vehicle_count: number;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  vehicle_type: VehicleType;
  vehicle_class: VehicleClass;
  brand: string | null;
  model: string | null;
  color: string | null;
  register_date: string | null;
  fleet_id: number | null;
  owner_id: number | null;
  obu_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleResponse extends Vehicle {
  fleet_name?: string;
  owner_name?: string;
  obu_sn?: string;
}

export interface ObuDevice {
  id: number;
  sn: string;
  manufacturer: string | null;
  model: string | null;
  firmware_version: string | null;
  status: ObuStatus;
  vehicle_id: number | null;
  activated_at: string | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObuDeviceResponse extends ObuDevice {
  plate_number?: string;
  vehicle_type?: string;
}

export interface TollRecord {
  id: number;
  record_no: string;
  vehicle_id: number;
  obu_id: number;
  toll_station: string;
  entry_station: string | null;
  exit_station: string | null;
  entry_time: string | null;
  exit_time: string | null;
  mileage: number | null;
  vehicle_type: VehicleType;
  vehicle_class: VehicleClass;
  base_fee: number;
  bridge_fee: number;
  tunnel_fee: number;
  surcharge: number;
  discount: number;
  paid_amount: number;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
}

export interface TollRecordResponse extends TollRecord {
  plate_number?: string;
  obu_sn?: string;
}

export interface TollTrace {
  id: number;
  toll_record_id: number;
  gps_longitude: number;
  gps_latitude: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  recorded_at: string;
}

export interface MonthlyBill {
  id: number;
  bill_no: string;
  year: number;
  month: number;
  vehicle_id: number;
  owner_id: number | null;
  fleet_id: number | null;
  total_trips: number;
  total_mileage: number;
  total_base_fee: number;
  total_bridge_fee: number;
  total_tunnel_fee: number;
  total_surcharge: number;
  total_discount: number;
  total_amount: number;
  paid_amount: number;
  status: BillStatus;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyBillResponse extends MonthlyBill {
  plate_number?: string;
  owner_name?: string;
  fleet_name?: string;
}

export interface Appeal {
  id: number;
  appeal_no: string;
  toll_record_id: number;
  user_id: number;
  type: AppealType;
  title: string;
  description: string;
  status: AppealStatus;
  claimed_amount: number;
  refund_amount: number | null;
  handler_id: number | null;
  handle_remark: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppealResponse extends Appeal {
  record_no?: string;
  plate_number?: string;
  user_name?: string;
  handler_name?: string;
}

export interface EtcAccount {
  id: number;
  account_no: string;
  user_id: number;
  balance: number;
  frozen_balance: number;
  total_recharge: number;
  total_consumption: number;
  status: AccountStatus;
  last_recharge_at: string | null;
  last_consumption_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EtcAccountResponse extends EtcAccount {
  user_name?: string;
}

export interface ObuUpgradeTask {
  id: number;
  task_no: string;
  name: string;
  description: string | null;
  firmware_version: string;
  firmware_url: string;
  status: UpgradeTaskStatus;
  total_devices: number;
  success_count: number;
  failed_count: number;
  created_by: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObuUpgradeTaskResponse extends ObuUpgradeTask {
  created_by_name?: string;
}

export interface ObuUpgradeLog {
  id: number;
  task_id: number;
  obu_id: number;
  status: UpgradeLogStatus;
  progress: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ObuUpgradeLogResponse extends ObuUpgradeLog {
  obu_sn?: string;
  task_name?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action: AuditAction;
  resource_type: string;
  resource_id: number | null;
  detail: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

import type { Request } from 'express';

export interface AuthRequest extends Request {
  user?: UserResponse;
}

export interface AuthPayload {
  id: number;
  username: string;
  role: UserRole;
  fleet_id?: number | null;
}

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
export type FirmwareDeviceStatus = 'pending' | 'downloading' | 'installing' | 'completed' | 'failed';

export interface Organization {
  id: number;
  name: string;
  type: OrgType;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
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
  id: number;
  user_id: number;
  org_id: number | null;
  device_id: number | null;
  access_level: AccessLevel;
  created_at: string;
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
}
