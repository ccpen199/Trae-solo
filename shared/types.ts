export type UserRole = 'supplier' | 'buyer' | 'operator';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  companyName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  unit: string;
  description: string;
  icon: string;
}

export interface MarketPrice {
  categoryId: string;
  categoryName: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  region?: string;
  recordedAt: string;
}

export interface PricePoint {
  date: string;
  price: number;
  category?: string;
}

export interface RegionalPrice {
  region: string;
  province: string;
  provinceCode: string;
  price: number;
  avgPrice: number;
  diff: number;
  diffPercent: number;
}

export interface PriceAlert {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  threshold: number;
  type: 'above' | 'below';
  notifyChannels: ('sms' | 'email' | 'app')[];
  enabled: boolean;
  createdAt: string;
}

export interface Supply {
  id: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  stationId?: string;
  stationName?: string;
  tonnage: number;
  purity: number;
  price: number;
  unit: string;
  province: string;
  city: string;
  address: string;
  description: string;
  images: string[];
  certified: boolean;
  status: 'active' | 'sold' | 'expired';
  createdAt: string;
  viewCount: number;
  inquiryCount: number;
}

export interface SupplyFilter {
  category?: string;
  minTonnage?: number;
  maxTonnage?: number;
  minPurity?: number;
  region?: string;
  certified?: boolean;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface Inquiry {
  id: string;
  supplyId: string;
  supplyTitle: string;
  buyerId: string;
  buyerName: string;
  expectedPrice?: number;
  message: string;
  status: 'pending' | 'replied' | 'accepted' | 'rejected';
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

export interface Certification {
  id: string;
  stationId: string;
  type: 'business_license' | 'operation_permit' | 'tax_certificate' | 'other';
  typeName: string;
  number: string;
  expiryDate: string;
  imageUrl: string;
  status: 'valid' | 'expired' | 'pending';
}

export interface Station {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  serviceRadius: number;
  province: string;
  city: string;
  longitude: number;
  latitude: number;
  phone: string;
  description: string;
  coverImage?: string;
  certifications: Certification[];
  rating: number;
  dealCount: number;
  createdAt: string;
}

export type AllianceLevel = 'leader' | 'branch' | 'station';

export interface AllianceMember {
  id: string;
  userId: string;
  userName: string;
  role: AllianceLevel;
  phone: string;
  joinedAt: string;
}

export interface AllianceNode {
  id: string;
  name: string;
  level: AllianceLevel;
  leaderId: string;
  leaderName: string;
  members: AllianceMember[];
  children: AllianceNode[];
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface AllianceTask {
  id: string;
  allianceId: string;
  allianceName: string;
  assignerId: string;
  assignerName: string;
  assigneeId: string;
  assigneeName: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  createdAt: string;
  completedAt?: string;
}

export type SettlementStatus = 'pending' | 'paid' | 'rejected';

export interface Settlement {
  id: string;
  allianceId: string;
  userId: string;
  userName: string;
  role: string;
  amount: number;
  period: string;
  status: SettlementStatus;
  description: string;
  createdAt: string;
  paidAt?: string;
}

export interface SettlementRule {
  id: string;
  role: AllianceLevel;
  percentage: number;
  description: string;
}

export interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface FunnelStep {
  name: string;
  value: number;
  conversionRate: number;
  dropRate: number;
}

export interface DashboardMetrics {
  totalTransaction: number;
  totalVolume: number;
  activeUsers: number;
  conversionRate: number;
  yoyGrowth: number;
  momGrowth: number;
  totalSupplies: number;
  totalInquiries: number;
  dealRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export const CATEGORIES: Category[] = [
  { id: '1', name: '废铜', code: 'CU', unit: '元/吨', description: '包括紫铜、黄铜、青铜等各类废铜', icon: 'copper' },
  { id: '2', name: '废铝', code: 'AL', unit: '元/吨', description: '包括铝合金、铝型材、铝屑等各类废铝', icon: 'aluminum' },
  { id: '3', name: '不锈钢', code: 'SS', unit: '元/吨', description: '包括304、316、201等各类不锈钢废料', icon: 'steel' },
  { id: '4', name: '废锌', code: 'ZN', unit: '元/吨', description: '包括锌合金、锌渣、锌灰等各类废锌', icon: 'zinc' },
  { id: '5', name: '废铅', code: 'PB', unit: '元/吨', description: '包括铅酸电池、铅板、铅渣等各类废铅', icon: 'lead' },
  { id: '6', name: '废锡', code: 'SN', unit: '元/吨', description: '包括锡渣、锡灰、锡条等各类废锡', icon: 'tin' },
  { id: '7', name: '电子废料', code: 'EW', unit: '元/吨', description: '包括电路板、电子元件、废旧电器等', icon: 'electronics' },
  { id: '8', name: '废钢铁', code: 'FE', unit: '元/吨', description: '包括钢筋、钢板、铁屑等各类废钢铁', icon: 'iron' },
  { id: '9', name: '废塑料', code: 'PL', unit: '元/吨', description: '包括PET、PVC、PE、PP等各类废塑料', icon: 'plastic' },
  { id: '10', name: '废纸', code: 'PPR', unit: '元/吨', description: '包括黄板纸、报纸、书刊纸等各类废纸', icon: 'paper' },
  { id: '11', name: '废橡胶', code: 'RU', unit: '元/吨', description: '包括轮胎、橡胶制品、胶管等各类废橡胶', icon: 'rubber' },
  { id: '12', name: '废玻璃', code: 'GL', unit: '元/吨', description: '包括平板玻璃、玻璃瓶、玻璃纤维等', icon: 'glass' },
];

export const PROVINCES = [
  { code: 'BJ', name: '北京' },
  { code: 'TJ', name: '天津' },
  { code: 'HE', name: '河北' },
  { code: 'SX', name: '山西' },
  { code: 'NM', name: '内蒙古' },
  { code: 'LN', name: '辽宁' },
  { code: 'JL', name: '吉林' },
  { code: 'HL', name: '黑龙江' },
  { code: 'SH', name: '上海' },
  { code: 'JS', name: '江苏' },
  { code: 'ZJ', name: '浙江' },
  { code: 'AH', name: '安徽' },
  { code: 'FJ', name: '福建' },
  { code: 'JX', name: '江西' },
  { code: 'SD', name: '山东' },
  { code: 'HA', name: '河南' },
  { code: 'HB', name: '湖北' },
  { code: 'HN', name: '湖南' },
  { code: 'GD', name: '广东' },
  { code: 'GX', name: '广西' },
  { code: 'HI', name: '海南' },
  { code: 'CQ', name: '重庆' },
  { code: 'SC', name: '四川' },
  { code: 'GZ', name: '贵州' },
  { code: 'YN', name: '云南' },
  { code: 'XZ', name: '西藏' },
  { code: 'SN', name: '陕西' },
  { code: 'GS', name: '甘肃' },
  { code: 'QH', name: '青海' },
  { code: 'NX', name: '宁夏' },
  { code: 'XJ', name: '新疆' },
];
