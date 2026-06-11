export interface User {
  id: number;
  username: string;
  phone: string;
  name: string;
  role: 'admin' | 'platform' | 'ops';
  status: string;
  created_at: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  manager_id: number;
  brand_partners: string[];
  status: string;
  created_at: string;
}

export interface Package {
  id: number;
  tracking_no: string;
  brand: string;
  type: string;
  status: string;
  branch_id: number;
  courier_id: number | null;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  weight: number;
  fee: number;
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
  type: string;
  status: string;
  branch_id: number;
  courier_id: number | null;
  tracking_no: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  address: string;
  scheduled_time: string | null;
  completed_at: string | null;
  fee: number;
  note: string | null;
  created_at: string;
  courier_name?: string;
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
  status: string;
  paid_at: string | null;
  created_at: string;
  courier_name?: string;
}

export interface Alert {
  id: number;
  type: string;
  level: string;
  title: string;
  description: string;
  branch_id: number;
  package_id: number | null;
  status: string;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginResult {
  token: string;
  user: User;
}

export const ROLE_MAP: Record<string, string> = {
  admin: '系统管理员',
  platform: '网点管理员',
  ops: '快递员',
};

export const PACKAGE_STATUS_MAP: Record<string, string> = {
  pending: '待入库',
  inbound: '已入库',
  stored: '在库',
  outbound: '已出库',
  signed: '已签收',
  exception: '异常',
};

export const PACKAGE_TYPE_MAP: Record<string, string> = {
  inbound: '入库',
  outbound: '出库',
};

export const TASK_STATUS_MAP: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  completed: '已完成',
  failed: '异常',
};

export const TASK_TYPE_MAP: Record<string, string> = {
  pickup: '揽件',
  delivery: '派件',
};

export const BRAND_MAP: Record<string, string> = {
  sf: '顺丰',
  zt: '中通',
  yt: '圆通',
  yd: '韵达',
  jt: '极兔',
};

export const SETTLEMENT_STATUS_MAP: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  paid: '已打款',
};

export const ALERT_LEVEL_MAP: Record<string, string> = {
  warning: '预警',
  critical: '严重',
};

export const ALERT_TYPE_MAP: Record<string, string> = {
  overdue: '超时预警',
  exception: '异常件预警',
  inventory_overflow: '库存溢出',
  fee_anomaly: '费用异常',
};

export interface LockerStation {
  id: number;
  name: string;
  code: string;
  type: string;
  address: string;
  total_slots: number;
  used_slots: number;
  branch_id: number;
  status: string;
  created_at: string;
}

export interface CustomerGroup {
  id: number;
  name: string;
  type: string;
  customer_count: number;
  total_orders: number;
  avg_fee: number;
  branch_id: number;
  tags: string[];
  created_at: string;
}

export interface PerformanceRecord {
  id: number;
  user_id: number;
  period: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  on_time_rate: number;
  customer_score: number;
  total_fee: number;
  bonus: number;
  deduction: number;
  branch_id: number;
  created_at: string;
  user_name?: string;
}

export interface ShopOrder {
  id: number;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  quantity: number;
  amount: number;
  status: string;
  tracking_no: string | null;
  branch_id: number;
  courier_id: number | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export const LOCKER_TYPE_MAP: Record<string, string> = {
  locker: '智能柜',
  station: '驿站',
};

export const CUSTOMER_TYPE_MAP: Record<string, string> = {
  normal: '普通客户',
  vip: 'VIP客户',
  enterprise: '企业客户',
  frequent: '高频寄件',
};

export const SHOP_ORDER_STATUS_MAP: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

export const SHOP_SOURCE_MAP: Record<string, string> = {
  wechat: '微信小店',
  douyin: '抖音',
  taobao: '淘宝',
  offline: '线下',
};

export const ERROR_CODE_MAP: Record<number, string> = {
  1001: '账号不存在',
  1002: '密码错误',
  1003: '账号已禁用',
  1004: '角色无权限',
};
