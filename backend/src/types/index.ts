export interface User {
  id: number;
  username: string;
  phone: string | null;
  password_hash: string;
  name: string;
  role: 'admin' | 'platform' | 'ops';
  status: 'active' | 'disabled';
  created_at: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  manager_id: number | null;
  brand_partners: string | null;
  status: 'active' | 'disabled';
  created_at: string;
}

export interface Package {
  id: number;
  tracking_no: string;
  brand: '顺丰' | '中通' | '圆通' | '韵达' | '极兔';
  type: 'inbound' | 'outbound';
  status: 'pending' | 'inbound' | 'stored' | 'outbound' | 'signed' | 'exception';
  branch_id: number;
  courier_id: number | null;
  sender_name: string | null;
  sender_phone: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  weight: number | null;
  fee: number | null;
  signed_by: string | null;
  signed_at: string | null;
  exception_type: string | null;
  exception_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PickupTask {
  id: number;
  task_no: string;
  type: 'pickup' | 'delivery';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  branch_id: number;
  courier_id: number | null;
  tracking_no: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  address: string | null;
  scheduled_time: string | null;
  completed_at: string | null;
  fee: number | null;
  note: string | null;
  created_at: string;
}

export interface Settlement {
  id: number;
  period: string;
  branch_id: number;
  courier_id: number;
  total_tasks: number;
  total_fee: number;
  bonus: number;
  deduction: number;
  net_amount: number;
  status: 'pending' | 'confirmed' | 'paid';
  paid_at: string | null;
  created_at: string;
}

export interface Alert {
  id: number;
  type: 'overdue' | 'exception' | 'inventory_overflow' | 'fee_anomaly';
  level: 'warning' | 'critical';
  title: string;
  description: string | null;
  branch_id: number | null;
  package_id: number | null;
  status: 'active' | 'resolved';
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface LockerStation {
  id: number; name: string; code: string; type: string; address: string;
  total_slots: number; used_slots: number; branch_id: number; status: string; created_at: string;
}

export interface CustomerGroup {
  id: number; name: string; type: string; customer_count: number;
  total_orders: number; avg_fee: number; branch_id: number; tags: string; created_at: string;
}

export interface PerformanceRecord {
  id: number; user_id: number; period: string; total_tasks: number;
  completed_tasks: number; failed_tasks: number; on_time_rate: number;
  customer_score: number; total_fee: number; bonus: number; deduction: number;
  branch_id: number; created_at: string;
}

export interface ShopOrder {
  id: number; order_no: string; customer_name: string; customer_phone: string;
  product_name: string; quantity: number; amount: number; status: string;
  tracking_no: string | null; branch_id: number; courier_id: number | null;
  source: string; created_at: string; updated_at: string;
}

export const ROLE_MAP: Record<string, string> = {
  admin: '系统管理员',
  platform: '网点管理员',
  ops: '快递员',
};

export const PACKAGE_STATUS_MAP: Record<string, string> = {
  pending: '待入库',
  inbound: '已入库',
  stored: '已存储',
  outbound: '已出库',
  signed: '已签收',
  exception: '异常',
};

export const PICKUP_TASK_STATUS_MAP: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  completed: '已完成',
  failed: '已失败',
};

export const BRAND_MAP: Record<string, string> = {
  '顺丰': '顺丰速运',
  '中通': '中通快递',
  '圆通': '圆通速递',
  '韵达': '韵达快递',
  '极兔': '极兔速递',
};

export const SETTLEMENT_STATUS_MAP: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  paid: '已支付',
};

export const ALERT_LEVEL_MAP: Record<string, string> = {
  warning: '警告',
  critical: '严重',
};

export const STATION_TYPE_MAP: Record<string, string> = { locker: '智能柜', station: '驿站', cabinet: '柜机' };
export const CUSTOMER_TYPE_MAP: Record<string, string> = { vip: 'VIP客户', normal: '普通客户', enterprise: '企业客户' };
export const SHOP_ORDER_STATUS_MAP: Record<string, string> = { pending: '待处理', processing: '处理中', shipped: '已发货', completed: '已完成', cancelled: '已取消' };
export const SHOP_SOURCE_MAP: Record<string, string> = { wechat: '微信', douyin: '抖音', taobao: '淘宝', other: '其他' };

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
