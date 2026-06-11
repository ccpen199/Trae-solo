export interface TaskHeatmapPoint {
  id: string;
  longitude: number;
  latitude: number;
  weight: number;
  type: 'pickup' | 'delivery' | 'exception';
  count: number;
}

export interface TaskWarning {
  id: string;
  type: 'overtime' | 'exception' | 'high_priority' | 'batch_task';
  title: string;
  description: string;
  waybillNo?: string;
  deadline?: number;
  severity: 'normal' | 'warning' | 'danger';
  createTime: number;
  isRead: boolean;
}

export interface DailyStats {
  date: string;
  totalPickup: number;
  completedPickup: number;
  totalDelivery: number;
  completedDelivery: number;
  exceptionCount: number;
  resolvedException: number;
  overtimeCount: number;
  workingHours: number;
  distance: number;
}

export interface CheckinRecord {
  id: string;
  courierId: string;
  type: 'check_in' | 'check_out' | 'fence_in' | 'fence_out';
  location: string;
  longitude: number;
  latitude: number;
  fenceId?: string;
  fenceName?: string;
  isInsideFence: boolean;
  accuracy: number;
  timestamp: number;
  deviceInfo?: string;
}

export interface Geofence {
  id: string;
  name: string;
  type: 'station' | 'delivery_area' | 'pickup_area' | 'restricted';
  centerLongitude: number;
  centerLatitude: number;
  radius: number;
  address: string;
  isActive: boolean;
}

export interface Evaluation {
  id: string;
  waybillNo: string;
  rating: number;
  content: string;
  tags: string[];
  negativeKeywords: string[];
  hasNegative: boolean;
  reviewerName: string;
  reviewerPhone: string;
  createTime: number;
  isHandled: boolean;
  handlerRemark?: string;
  handleTime?: number;
}

export const NEGATIVE_KEYWORDS = [
  '慢', '延迟', '迟到', '超时', '太慢', '太慢了',
  '态度差', '不耐烦', '凶', '骂人', '说话难听',
  '破损', '坏了', '损坏', '压扁', '变形',
  '丢了', '丢失', '找不到', '没收到',
  '错发', '错派', '送错', '放错',
  '不上门', '不送货', '扔驿站', '不联系',
  '包装差', '包装烂', '没包装',
  '投诉', '差评', '垃圾', '差劲',
  '私自', '擅自', '没经过', '没打招呼'
];

export interface ArchiveRecord {
  id: string;
  waybillNo: string;
  archiveType: 'normal' | 'exception' | 'complaint' | 'legal';
  archiveTime: number;
  archivist: string;
  evidenceHash: string;
  blockchainTxId?: string;
  storageUrl: string;
  retentionYears: number;
  isVerified: boolean;
  verifyTime?: number;
}
