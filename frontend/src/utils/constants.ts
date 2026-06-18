import type { DeviceType, UserRole, DeviceStatus, WorkingStatus, BookingStatus, OrderStatus, PaymentStatus, WorkOrderStatus, Priority } from '@/types';

export const DEVICE_TYPE_MAP: Record<DeviceType, string> = {
  washer: '洗衣机',
  dryer: '烘干机',
  water_dispenser: '饮水机',
  shower: '智能淋浴',
};

export const DEVICE_TYPE_ICONS: Record<DeviceType, string> = {
  washer: '🧺',
  dryer: '🌀',
  water_dispenser: '💧',
  shower: '🚿',
};

export const DEVICE_TYPE_COLORS: Record<DeviceType, string> = {
  washer: '#1890ff',
  dryer: '#722ed1',
  water_dispenser: '#13c2c2',
  shower: '#52c41a',
};

export const DEVICE_STATUS_MAP: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  maintenance: '维护中',
  faulty: '故障',
  retired: '已下架',
};

export const WORKING_STATUS_MAP: Record<WorkingStatus, string> = {
  idle: '空闲',
  running: '运行中',
  paused: '已暂停',
  reserved: '已预约',
  completed: '已完成',
};

export const WORKING_STATUS_COLOR_MAP: Record<WorkingStatus, string> = {
  idle: '#2f54eb',
  running: '#1890ff',
  paused: '#faad14',
  reserved: '#722ed1',
  completed: '#52c41a',
};

export const BOOKING_STATUS_MAP: Record<BookingStatus, string> = {
  pending: '待支付',
  confirmed: '已确认',
  active: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  expired: '已过期',
  refunded: '已退款',
};

export const BOOKING_STATUS_COLOR_MAP: Record<BookingStatus, string> = {
  pending: '#faad14',
  confirmed: '#1890ff',
  active: '#52c41a',
  completed: '#52c41a',
  cancelled: '#bfbfbf',
  expired: '#ff4d4f',
  refunded: '#722ed1',
};

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
  failed: '失败',
};

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, string> = {
  unpaid: '待支付',
  paid: '已支付',
  refunding: '退款中',
  refunded: '已退款',
  failed: '支付失败',
  cancelled: '已取消',
};

export const WORK_ORDER_STATUS_MAP: Record<WorkOrderStatus, string> = {
  pending: '待处理',
  assigned: '已指派',
  processing: '处理中',
  pending_parts: '待备件',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒绝',
};

export const WORK_ORDER_TYPE_MAP: Record<string, string> = {
  fault: '故障报修',
  maintenance: '定期维护',
  inspection: '巡检',
  repair: '维修',
  install: '安装',
};

export const PRIORITY_MAP: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const PRIORITY_COLOR_MAP: Record<Priority, string> = {
  low: '#8c8c8c',
  medium: '#faad14',
  high: '#ff7a45',
  urgent: '#ff4d4f',
};

export const ROLE_MAP: Record<UserRole, string> = {
  resident: '居民',
  property: '物业管理员',
  operator: '运营人员',
  admin: '系统管理员',
};

export const WASH_MODES = [
  { value: 'quick', label: '快速洗', duration: 20, multiplier: 0.8 },
  { value: 'standard', label: '标准洗', duration: 30, multiplier: 1.0 },
  { value: 'intensive', label: '加强洗', duration: 45, multiplier: 1.3 },
  { value: 'hot', label: '热水洗', duration: 35, multiplier: 1.2 },
];

export const SHOWER_MODES = [
  { value: 'cold', label: '冷水', duration: 15, multiplier: 1.0 },
  { value: 'warm', label: '温水', duration: 15, multiplier: 1.2 },
  { value: 'hot', label: '热水', duration: 15, multiplier: 1.3 },
];

export const WATER_MODES = [
  { value: 'cold', label: '常温水', duration: 1, multiplier: 1.0 },
  { value: 'warm', label: '温水', duration: 1, multiplier: 1.5 },
  { value: 'hot', label: '热水', duration: 1, multiplier: 2.0 },
];

export const getDeviceModes = (deviceType: DeviceType) => {
  switch (deviceType) {
    case 'washer':
    case 'dryer':
      return WASH_MODES;
    case 'shower':
      return SHOWER_MODES;
    case 'water_dispenser':
      return WATER_MODES;
    default:
      return WASH_MODES;
  }
};
